import * as youtubeService from '../../providers/video/youtube.service.js';

export const findVideosForMicroTopic = async (course, microTopicTitle) => {
  const videos = await youtubeService.searchEducationalVideos(
    course.searchTopic || course.topic,
    microTopicTitle
  );

  return videos.slice(0, 3);
};
