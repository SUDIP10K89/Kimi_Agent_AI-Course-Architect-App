/**
 * Custom YouTube Player Component
 * 
 * Uses react-native-webview with iframe embedding for cross-platform support.
 * Works on iOS, Android, and Web.
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/contexts/ThemeContext';

interface YouTubePlayerProps {
  videoId: string;
  height?: number;
  play?: boolean;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ 
  videoId, 
  height = 220, 
  play = false 
}) => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  // Generate YouTube embed HTML with iframe API
  const getYouTubeEmbedHTML = useCallback((videoId: string, autoplay: boolean) => {
    const autoplayParam = autoplay ? 1 : 0;
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * { margin: 0; padding: 0; }
            html, body { 
              width: 100%; 
              height: 100%; 
              background-color: #000;
            }
            iframe {
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>
        <body>
          <iframe 
            src="https://www.youtube.com/embed/${videoId}?autoplay=${autoplayParam}&enablejsapi=1&rel=0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </body>
      </html>
    `;
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Calculate aspect ratio width based on height (16:9 aspect ratio)
  const width = height * (16 / 9);

  return (
    <View style={[styles.container, { height, width }]}>
      {isLoading && (
        <View style={[styles.loader, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      <WebView
        source={{ html: getYouTubeEmbedHTML(videoId, play) }}
        style={[styles.webview, { height, width }]}
        onLoadEnd={handleLoadEnd}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        // Use mixed content for YouTube
        mixedContentMode="always"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#000',
  },
  webview: {
    backgroundColor: '#000',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

export default YouTubePlayer;
