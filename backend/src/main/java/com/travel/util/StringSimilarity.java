package com.travel.util;

public class StringSimilarity {

    public static int levenshteinDistance(String str1, String str2) {
        if (str1 == null || str2 == null) {
            return str1 == null ? (str2 == null ? 0 : str2.length()) : str1.length();
        }

        int m = str1.length();
        int n = str2.length();
        int[][] dp = new int[m + 1][n + 1];

        for (int i = 0; i <= m; i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= n; j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (str1.charAt(i - 1) == str2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(
                            Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                            dp[i - 1][j - 1] + 1
                    );
                }
            }
        }

        return dp[m][n];
    }

    public static double calculateSimilarity(String str1, String str2) {
        if (str1 == null || str2 == null) {
            return 0.0;
        }

        String s1 = str1.toLowerCase().trim();
        String s2 = str2.toLowerCase().trim();

        if (s1.equals(s2)) {
            return 1.0;
        }

        int maxLen = Math.max(s1.length(), s2.length());
        if (maxLen == 0) {
            return 1.0;
        }

        int distance = levenshteinDistance(s1, s2);
        double baseSimilarity = 1.0 - (double) distance / maxLen;

        double bonus = 0.0;

        if (s1.contains(s2) || s2.contains(s1)) {
            bonus += 0.15;
        }

        int prefixLen = getCommonPrefixLength(s1, s2);
        if (prefixLen >= 2) {
            bonus += Math.min(0.1, (double) prefixLen / maxLen * 0.2);
        }

        int suffixLen = getCommonSuffixLength(s1, s2);
        if (suffixLen >= 2) {
            bonus += Math.min(0.1, (double) suffixLen / maxLen * 0.2);
        }

        return Math.min(1.0, baseSimilarity + bonus);
    }

    private static int getCommonPrefixLength(String str1, String str2) {
        int i = 0;
        while (i < str1.length() && i < str2.length() && str1.charAt(i) == str2.charAt(i)) {
            i++;
        }
        return i;
    }

    private static int getCommonSuffixLength(String str1, String str2) {
        int i = 0;
        int len1 = str1.length();
        int len2 = str2.length();
        while (i < len1 && i < len2 && str1.charAt(len1 - 1 - i) == str2.charAt(len2 - 1 - i)) {
            i++;
        }
        return i;
    }
}
