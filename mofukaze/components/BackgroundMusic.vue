<template>
  <div class="music-player" :class="{ open: isOpen }">
    <button class="music-toggle" type="button" title="背景音乐" @click="isOpen = !isOpen">
      <Music2 />
    </button>

    <audio
      ref="audioRef"
      :src="currentSrc"
      preload="metadata"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @ended="handleEnded"
      @loadedmetadata="syncAudioState"
      @durationchange="syncAudioState"
      @timeupdate="handleTimeUpdate"
    ></audio>

    <transition name="music-panel">
      <section v-if="isOpen" class="music-panel" aria-label="背景音乐">
        <header>
          <div class="track-art">
            <img v-if="currentCover" :src="currentCover" :alt="currentTrack?.title || 'cover'" />
            <Music2 v-else />
          </div>

          <div class="track-copy">
            <strong>{{ currentTrack?.title || '暂无曲目' }}</strong>
            <span>{{ currentTrack?.artist || 'Mofukaze Music' }}</span>
          </div>

          <button class="icon-button" type="button" title="关闭" @click="isOpen = false">
            <X />
          </button>
        </header>

        <div class="progress-row">
          <span>{{ formatTime(currentTime) }}</span>
          <input
            class="progress-slider"
            type="range"
            min="0"
            :max="duration || 0"
            step="1"
            :value="currentTime"
            :disabled="!tracks.length || !duration"
            aria-label="播放进度"
            @input="seekTo"
            @pointerdown="isSeeking = true"
            @pointerup="finishSeeking"
            @pointercancel="isSeeking = false"
            @change="finishSeeking"
            @keydown.left.prevent="nudgeSeek(-5)"
            @keydown.right.prevent="nudgeSeek(5)"
          />
          <span>{{ formatTime(duration) }}</span>
        </div>

        <div class="music-controls">
          <button class="icon-button" type="button" title="上一首" :disabled="!tracks.length" @click="prevTrack()">
            <SkipBack />
          </button>
          <button class="play-button" type="button" title="播放/暂停" :disabled="!tracks.length" @click="togglePlay">
            <Pause v-if="isPlaying" />
            <Play v-else />
          </button>
          <button class="icon-button" type="button" title="下一首" :disabled="!tracks.length" @click="nextTrack()">
            <SkipForward />
          </button>
          <Volume2 />
          <input v-model.number="volume" type="range" min="0" max="1" step="0.01" aria-label="音量" />
        </div>

        <div v-if="tracks.length > 1" class="track-list">
          <button
            v-for="(track, index) in tracks"
            :key="`${track.src}-${index}`"
            type="button"
            :class="{ active: index === currentIndex }"
            @click="selectTrack(index)"
          >
            <span>{{ track.title }}</span>
            <small>{{ track.artist || 'Unknown' }}</small>
          </button>
        </div>
      </section>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { Music2, Pause, Play, SkipBack, SkipForward, Volume2, X } from 'lucide-vue-next'

type MusicTrack = {
  title: string
  artist?: string
  src: string
  cover?: string
}

const MUSIC_INDEX_KEY = 'mofukaze.music-index'
const MUSIC_VOLUME_KEY = 'mofukaze.music-volume'

const config = useRuntimeConfig()
const musicBase = computed(() => String(config.public.musicBase || '/music').replace(/\/$/, ''))
const tracks = ref<MusicTrack[]>([])
const currentIndex = ref(0)
const isOpen = ref(false)
const isPlaying = ref(false)
const isSeeking = ref(false)
const volume = ref(0.56)
const currentTime = ref(0)
const duration = ref(0)
const audioRef = ref<HTMLAudioElement | null>(null)

const currentTrack = computed(() => tracks.value[currentIndex.value] || null)
const currentSrc = computed(() => currentTrack.value ? resolveMusicUrl(currentTrack.value.src) : '')
const currentCover = computed(() => {
  if (!currentTrack.value?.cover) return ''
  return resolveMusicUrl(currentTrack.value.cover)
})

const resolveMusicUrl = (src: string) => {
  if (/^https?:\/\//i.test(src)) return src
  const cleanSrc = src.replace(/^\/+/, '').replace(/^music\//, '')
  return `${musicBase.value}/${cleanSrc}`
}

const normalizeTracks = (payload: any): MusicTrack[] => {
  const list = Array.isArray(payload) ? payload : Array.isArray(payload?.tracks) ? payload.tracks : []

  return list
    .map((track: any) => ({
      title: String(track.title || track.name || 'Untitled'),
      artist: track.artist ? String(track.artist) : '',
      src: String(track.src || track.url || ''),
      cover: track.cover ? String(track.cover) : '',
    }))
    .filter((track: MusicTrack) => track.src)
}

const loadPlaylist = async () => {
  try {
    const response = await fetch(`${musicBase.value}/playlist.json`, { cache: 'no-store' })
    if (!response.ok) return

    tracks.value = normalizeTracks(await response.json())
    const savedIndex = Number(window.localStorage.getItem(MUSIC_INDEX_KEY) || 0)
    currentIndex.value = Math.min(Math.max(savedIndex, 0), Math.max(tracks.value.length - 1, 0))
  } catch (error) {
    console.warn('[music] playlist load failed', error)
  }
}

const syncVolume = () => {
  if (audioRef.value) {
    audioRef.value.volume = volume.value
  }
  window.localStorage.setItem(MUSIC_VOLUME_KEY, String(volume.value))
}

const getSafeTime = (value: number) => Number.isFinite(value) && value > 0 ? value : 0

const syncAudioState = () => {
  if (!audioRef.value) return
  duration.value = getSafeTime(audioRef.value.duration)
  currentTime.value = getSafeTime(audioRef.value.currentTime)
}

const handleTimeUpdate = () => {
  if (isSeeking.value || !audioRef.value) return
  currentTime.value = getSafeTime(audioRef.value.currentTime)
}

const seekTo = (event: Event) => {
  const nextTime = Number((event.target as HTMLInputElement).value)
  currentTime.value = getSafeTime(nextTime)

  if (audioRef.value && Number.isFinite(nextTime)) {
    audioRef.value.currentTime = nextTime
  }
}

const finishSeeking = (event: Event) => {
  seekTo(event)
  isSeeking.value = false
}

const nudgeSeek = (seconds: number) => {
  if (!audioRef.value || !duration.value) return
  const nextTime = Math.min(Math.max(audioRef.value.currentTime + seconds, 0), duration.value)
  audioRef.value.currentTime = nextTime
  currentTime.value = nextTime
}

const formatTime = (seconds: number) => {
  const total = Math.floor(getSafeTime(seconds))
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

const playCurrent = async () => {
  await nextTick()
  try {
    await audioRef.value?.play()
  } catch {
    isPlaying.value = false
  }
}

const togglePlay = async () => {
  if (!audioRef.value || !tracks.value.length) return

  if (audioRef.value.paused) {
    await playCurrent()
    return
  }

  audioRef.value.pause()
}

const selectTrack = async (index: number) => {
  await switchTrack(index, isPlaying.value)
}

const switchTrack = async (index: number, shouldPlay = isPlaying.value) => {
  if (!tracks.value.length) return

  const nextIndex = (index + tracks.value.length) % tracks.value.length
  const isSameTrack = nextIndex === currentIndex.value

  currentIndex.value = nextIndex
  currentTime.value = 0
  duration.value = 0

  await nextTick()

  if (isSameTrack && audioRef.value) {
    audioRef.value.currentTime = 0
  }

  if (shouldPlay) {
    await playCurrent()
  }
}

const nextTrack = async (shouldPlay = isPlaying.value) => {
  await switchTrack(currentIndex.value + 1, shouldPlay)
}

const prevTrack = async (shouldPlay = isPlaying.value) => {
  await switchTrack(currentIndex.value - 1, shouldPlay)
}

const handleEnded = async () => {
  await nextTrack(true)
}

watch(volume, syncVolume)

watch(currentIndex, (index) => {
  window.localStorage.setItem(MUSIC_INDEX_KEY, String(index))
  currentTime.value = 0
  duration.value = 0
})

onMounted(async () => {
  const savedVolume = Number(window.localStorage.getItem(MUSIC_VOLUME_KEY))
  if (Number.isFinite(savedVolume)) {
    volume.value = Math.min(Math.max(savedVolume, 0), 1)
  }
  syncVolume()
  await loadPlaylist()
})
</script>

<style scoped>
.music-player {
  bottom: 22px;
  position: fixed;
  right: 22px;
  z-index: 2500;
}

.music-toggle,
.icon-button,
.play-button {
  align-items: center;
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  color: var(--theme-text);
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  justify-content: center;
  transition: background 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}

.music-toggle {
  background: color-mix(in srgb, var(--theme-accent) 24%, var(--surface-floating));
  box-shadow: 0 10px 26px var(--theme-shadow);
  height: 46px;
  width: 46px;
  backdrop-filter: blur(16px) saturate(135%);
}

.music-toggle:hover,
.icon-button:hover:not(:disabled),
.play-button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--theme-accent) 36%, var(--surface-floating));
  box-shadow: 0 10px 26px var(--theme-glow);
  transform: translateY(-1px);
}

.music-panel {
  background: var(--surface-floating);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  bottom: 58px;
  box-shadow: 0 18px 46px var(--theme-shadow);
  color: var(--theme-text);
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  position: absolute;
  right: 0;
  width: min(340px, calc(100vw - 34px));
  backdrop-filter: blur(16px) saturate(135%);
}

.music-panel header {
  align-items: center;
  display: grid;
  gap: 10px;
  grid-template-columns: 48px minmax(0, 1fr) 34px;
}

.track-art {
  align-items: center;
  background: var(--surface-soft);
  border-radius: 8px;
  display: flex;
  height: 48px;
  justify-content: center;
  overflow: hidden;
  width: 48px;
}

.track-art img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.track-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.track-copy strong,
.track-copy span,
.track-list span,
.track-list small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-copy span,
.track-list small {
  color: var(--readable-muted);
  font-size: 12px;
}

.music-controls {
  align-items: center;
  display: grid;
  gap: 9px;
  grid-template-columns: 34px 42px 34px 18px minmax(0, 1fr);
}

.progress-row {
  align-items: center;
  display: grid;
  gap: 9px;
  grid-template-columns: 42px minmax(0, 1fr) 42px;
}

.progress-row span {
  color: var(--readable-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.icon-button,
.play-button {
  background: var(--surface-soft);
  height: 34px;
  padding: 0;
  width: 34px;
}

.play-button {
  height: 42px;
  width: 42px;
}

.icon-button:disabled,
.play-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.music-controls svg,
.music-toggle svg,
.icon-button svg,
.play-button svg {
  height: 18px;
  width: 18px;
}

.music-controls input,
.progress-slider {
  accent-color: var(--theme-accent);
  min-width: 0;
}

.progress-slider:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.track-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 160px;
  overflow: auto;
}

.track-list button {
  background: var(--surface-soft);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  color: var(--theme-text);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  font: inherit;
  gap: 2px;
  padding: 8px 10px;
  text-align: left;
}

.track-list button.active {
  background: color-mix(in srgb, var(--theme-accent) 22%, transparent);
  border-color: color-mix(in srgb, var(--theme-accent) 52%, transparent);
}

.music-panel-enter-active,
.music-panel-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.music-panel-enter-from,
.music-panel-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

@media (max-width: 640px) {
  .music-player {
    bottom: 14px;
    right: 14px;
  }
}
</style>
