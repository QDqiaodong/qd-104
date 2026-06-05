package com.travel.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;

public class ImageListSerializer {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static String serialize(List<String> images) {
        if (images == null || images.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(images);
        } catch (Exception e) {
            return "[]";
        }
    }

    public static List<String> deserialize(String imagesStr) {
        if (imagesStr == null || imagesStr.isEmpty()) {
            return new ArrayList<>();
        }

        imagesStr = imagesStr.trim();

        if (imagesStr.startsWith("[") && imagesStr.endsWith("]")) {
            try {
                return objectMapper.readValue(imagesStr, new TypeReference<List<String>>() {});
            } catch (Exception e) {
                return new ArrayList<>();
            }
        }

        List<String> result = new ArrayList<>();
        if (imagesStr.contains("data:image") || imagesStr.startsWith("data:")) {
            String[] parts = imagesStr.split(",(?=data:image|data:)");
            for (String part : parts) {
                String trimmed = part.trim();
                if (!trimmed.isEmpty()) {
                    result.add(trimmed);
                }
            }
        } else {
            String[] parts = imagesStr.split(",");
            for (String part : parts) {
                String trimmed = part.trim();
                if (!trimmed.isEmpty()) {
                    result.add(trimmed);
                }
            }
        }

        return result;
    }

    public static boolean isJsonFormat(String imagesStr) {
        if (imagesStr == null || imagesStr.isEmpty()) {
            return false;
        }
        String trimmed = imagesStr.trim();
        return trimmed.startsWith("[") && trimmed.endsWith("]");
    }
}
