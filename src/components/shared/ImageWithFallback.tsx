import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Image, ImageProps } from 'expo-image';

interface ImageWithFallbackProps extends Omit<ImageProps, 'source'> {
    src: string;
    alt?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
    src,
    alt,
    className,
    ...props
}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    if (error) {
        return (
            <View className={`bg-gray-200 items-center justify-center ${className}`}>
                <Text className="text-gray-400 text-sm">Image unavailable</Text>
            </View>
        );
    }

    return (
        <View className={className}>
            {loading && (
                <View className="absolute inset-0 bg-gray-200 items-center justify-center">
                    <ActivityIndicator color="#22C55E" />
                </View>
            )}
            <Image
                source={{ uri: src }}
                className="w-full h-full"
                contentFit="cover"
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                    setLoading(false);
                    setError(true);
                }}
                {...props}
            />
        </View>
    );
};
