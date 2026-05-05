<template>
  <div class="collection-page">  <!-- ✅ 根节点包裹 -->
    <el-button v-if="ifVisible" @click="openEditor">添加收藏</el-button>


    <!-- 游戏收藏卡片 -->
    <el-card style="max-width: 1180px">
      <template #header>
        <div class="card-header">
          <span>我喜欢的游戏!</span>
        </div>
      </template>
      <div v-if="games.length">
        <el-image
          v-for="(game, index) in limitedGames"
          :key="index"
          :src="game.imageUrl"
          class="cover-image"
          @click="redirectToCollection(game.id)"
        />
        <p v-if="games.length > 10" class="ellipsis">......</p>
      </div>
      <template #footer>
        我玩的游戏很杂，可以说没有什么固定的喜好，玩的最多的是动作游戏(怪物猎人，鬼泣系列)，但我最喜欢的是一款网游，而最长时间的是minecraft
      </template>
    </el-card>

    <!-- 动漫收藏卡片 -->
    <el-card style="max-width: 1180px">
      <template #header>
        <div class="card-header">
          <span>我喜欢的动漫!</span>
        </div>
      </template>
      <div v-if="animes.length">
        <el-image
          v-for="(anime, index) in limitedAnimes"
          :key="index"
          :src="anime.imageUrl"
          class="cover-image"
          @click="redirectToCollection(anime.id)"
        />
        <p v-if="animes.length > 10" class="ellipsis">......</p>
      </div>
      <template #footer>老二次元了</template>
    </el-card>

    <!-- 电影收藏卡片 -->
    <el-card style="max-width: 1180px">
      <template #header>
        <div class="card-header">
          <span>我喜欢的电影!</span>
        </div>
      </template>
      <div v-if="movies.length">
        <el-image
          v-for="(movie, index) in limitedMovies"
          :key="index"
          :src="movie.imageUrl"
          class="cover-image"
          @click="redirectToCollection(movie.id)"
        />
        <p v-if="movies.length > 10" class="ellipsis">......</p>
      </div>
      <template #footer>
        电影看得很少，但不可否认其中一些作品深刻影响了我的某些观念
      </template>
    </el-card>

    <!-- 音乐专辑收藏卡片 -->
    <el-card style="max-width: 1180px">
      <template #header>
        <div class="card-header">
          <span>我喜欢的音乐专辑!</span>
        </div>
      </template>
      <div v-if="albums.length">
        <el-image
          v-for="(album, index) in limitedAlbums"
          :key="index"
          :src="album.imageUrl"
          class="cover-image"
          @click="redirectToCollection(album.id)"
        />
        <p v-if="albums.length > 10" class="ellipsis">......</p>
      </div>
      <template #footer>
        我最喜欢摇滚乐，出这些专辑的乐队大多比较老，起码比我的年纪大得多
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLoading = ref(true);
const collections = ref<{ id: number, title: string, time: string, tag: string,imageUrl:string }[]>([]);
const admin = useAdmin()

const ifVisible = computed(() => !!admin.getAuthHeader())
// 定义存储分类信息的变量
const games = ref<{ id: number, title: string, time: string, tag: string,imageUrl:string }[]>([]);
const animes = ref<{ id: number, title: string, time: string, tag: string,imageUrl:string }[]>([]);
const movies = ref<{ id: number, title: string, time: string, tag: string,imageUrl:string }[]>([]);
const albums = ref<{ id: number, title: string, time: string, tag: string,imageUrl:string }[]>([]);

// 定义分类中最多显示的项目数
const maxDisplayItems = 10;
const config=useRuntimeConfig();

const openEditor = () => {
  router.push('/imgCut');
};

// 调用 API 并根据 tag 分类
onMounted(async () => {
  const response = await $fetch(`/api/posts/collection/getCollectionInfo`, {
    method: 'GET',
  });
  const result: any[] = response as unknown as any[];

  collections.value = result.map(item => ({
    id: item.id,
    title: item.title,
    time: item.posttime,
    tag: item.tag,
    imageUrl: `${config.public.cdn}/img/cover/${item.title}.jpeg`, // 将封面图片路径改为基于标题的路径
  }));

  games.value = collections.value.filter(item => item.tag === '游戏');
  animes.value = collections.value.filter(item => item.tag === '动漫');
  movies.value = collections.value.filter(item => item.tag === '电影');
  albums.value = collections.value.filter(item => item.tag === '音乐');

  // 🖤 打印所有收藏的 imageUrl
  console.log('全部收藏的 imageUrl：');
  collections.value.forEach(item => {
    console.log(item.imageUrl);
  });


  // 模拟异步操作或页面加载
setTimeout(() => {
  isLoading.value = false;
}, 1000); // 1秒后隐藏loading
});

// 限制显示数量的计算属性
const limitedGames = computed(() => games.value.slice(0, maxDisplayItems));
const limitedAnimes = computed(() => animes.value.slice(0, maxDisplayItems));
const limitedMovies = computed(() => movies.value.slice(0, maxDisplayItems));
const limitedAlbums = computed(() => albums.value.slice(0, maxDisplayItems));


const redirectToCollection = (id: number) => {
  router.push(`/collections/${id}`);
};
</script>

<style scoped>
.cover-image {
  width: 100px;
  height: 100px;
  margin: 10px;
  transition: transform 0.3s ease, box-shadow 0.3s ease; /* 设置平滑过渡时间 */
}

.cover-image:hover {
  transform: scale(1.1); /* 平滑的缩放效果 */
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3); /* 加强阴影效果并保持平滑 */
  transition: transform 0.3s ease, box-shadow 0.3s ease; /* 添加渐变效果 */
}


.ellipsis {
  text-align: center;
  font-size: 24px;
}

</style>
