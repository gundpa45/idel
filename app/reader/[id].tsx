import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { books } from "@/services/full";

const ReaderPage = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const book = books.find((b) => b.id === Number(id));

  if (!book) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a071e]">
        <Text className="text-white text-lg">Book not found</Text>
      </View>
    );
  }

  const isLargeScreen = width > 700; // Desktop/tablet layout

  return (
    <ScrollView className="flex-1 bg-[#0a071e] px-5 py-10">
      <View
        className={`flex ${
          isLargeScreen
            ? "flex-row items-start justify-center space-x-10"
            : "flex-col items-center"
        }`}
      >
        {/* Left Side - Book Image */}
        <Image
          source={book.image}
          className={`${
            isLargeScreen ? "w-60 h-80" : "w-44 h-64"
          } rounded-2xl shadow-lg`}
          resizeMode="cover"
        />

        {/* Right Side - Details */}
        <View
          className={`${
            isLargeScreen ? "flex-1" : "w-full"
          } mt-6 space-y-4`}
        >
          {/* Title */}
          <Text className="text-3xl font-extrabold text-white text-center md:text-left">
            {book.title}
          </Text>

          {/* Author, Year */}
          <Text className="text-gray-300 text-sm text-center md:text-left">
            By {book.author} • {book.year}
          </Text>

          {/* Star Rating */}
          <View className="flex-row items-center justify-center md:justify-start space-x-2">
            <Ionicons name="star" size={18} color="#FFD700" />
            <Text className="text-yellow-400 text-base font-semibold">
              {book.star || "4.5"} / 5
            </Text>
          </View>

          {/* Description */}
          <Text className="text-gray-200 text-base leading-6 text-justify mt-2">
            {book.description ||
              "This book offers a fascinating journey through its storyline — perfect for those who love learning, inspiration, and personal growth. Explore deep insights, valuable lessons, and transformative perspectives that enrich your personal and professional life."}
          </Text>

          {/* Start Reading Button */}
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/BookReader",
                params: { 
                  link: book.link, 
                  title: book.title,
                  bookId: book.id.toString()
                },
              })
            }
            activeOpacity={0.8}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 py-3 rounded-xl mt-6 w-3/4 self-center md:self-start shadow-lg shadow-indigo-800/40"
          >
            <Text className="text-center text-white text-base font-semibold tracking-wide">
              Start Reading 📖
            </Text>
          </TouchableOpacity>

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 self-center md:self-start"
          >
            <Text className="text-indigo-300 text-sm underline">
              ← Back to Library
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default ReaderPage;
