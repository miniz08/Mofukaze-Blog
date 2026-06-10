type ResourcePurpose = 'article-image' | 'collection-cover' | 'video' | 'music';

type UploadOptions = {
  title?: string;
  filename?: string;
};

type UploadResult = {
  status: string;
  fileUrl?: string;
  url?: string;
  message?: string;
  hash?: string;
  size?: number;
  purpose?: ResourcePurpose;
};

const readUploadResponse = async (response: Response): Promise<UploadResult> => {
  const payload = await response.json().catch(async () => ({
    status: 'fail',
    message: await response.text().catch(() => '资源上传失败'),
  }));

  if (!response.ok || payload.status !== 'success') {
    throw new Error(payload.message || '资源上传失败');
  }

  if (!payload.fileUrl && !payload.url) {
    throw new Error('资源上传成功，但没有返回访问地址');
  }

  return payload;
};

export const useResourceUpload = () => {
  const admin = useAdmin();

  const uploadResource = async (
    file: File | Blob,
    purpose: ResourcePurpose,
    options: UploadOptions = {},
  ) => {
    const formData = new FormData();
    const filename =
      options.filename ||
      (file instanceof File ? file.name : `${purpose}-${Date.now()}`);

    formData.append('resource', file, filename);
    formData.append('purpose', purpose);
    if (options.title) formData.append('title', options.title);
    if (options.filename) formData.append('filename', options.filename);

    const response = await fetch('/api/posts/resource/upload', {
      method: 'POST',
      headers: {
        ...admin.getAuthHeader(),
      },
      body: formData,
    });

    const result = await readUploadResponse(response);
    return result.fileUrl || result.url || '';
  };

  const uploadDataUrl = async (
    dataUrl: string,
    purpose: ResourcePurpose,
    options: UploadOptions = {},
  ) => {
    const response = await fetch('/api/posts/resource/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...admin.getAuthHeader(),
      },
      body: JSON.stringify({
        resource: dataUrl,
        purpose,
        title: options.title,
        filename: options.filename,
      }),
    });

    const result = await readUploadResponse(response);
    return result.fileUrl || result.url || '';
  };

  return {
    uploadResource,
    uploadDataUrl,
  };
};
