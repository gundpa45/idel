import React, { useState, useEffect } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import SearchBar from "@/components/SearchBar";
import { images } from "@/constants/images";
import { icons } from "@/constants/icons";
import { books } from "@/services/full";

const Save = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true); // Track loading state
  const router = useRouter();

  // 🔍 Filter books by title or author
  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(query.toLowerCase()) ||
      book.author.toLowerCase().includes(query.toLowerCase())
  );

  // Debug log for filteredBooks
  useEffect(() => {
    console.log("Filtered Books: ", filteredBooks); // Log filtered books to check if data is there
  }, [filteredBooks]);

  // 📖 Render each book card
  const renderBook = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() =>
        router.push({
          pathname: `/reader/${item.id}`,
          params: {
            id: item.id,
            title: item.title,
            author: item.author,
            year: item.year,
            star: item.star,
            link: item.link,
            description: item.description,
          },
        })
      }
      className="w-[140px] mb-8 mx-2"
    >
      {/* Book Cover */}
      <View className="rounded-2xl overflow-hidden shadow-lg shadow-black/40 bg-[#1a1a2e]">
        <Image
          source={item.image}
          className="w-full h-[190px]"
          resizeMode="contain"
        />
      </View>

      {/* Book Info */}
      <View className="mt-3 px-1">
        <Text
          className="text-white text-[12px] font-semibold"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>

        <Text className="text-gray-400 text-[10px]" numberOfLines={1}>
          {item.author}
        </Text>

        {/* Single Star + Number Rating */}
        <View className="flex-row items-center mt-1">
          <Text className="text-yellow-400 text-[11px]">⭐</Text>
          <Text className="text-gray-300 text-[10px] ml-1">{item.star}</Text>
        </View>

        <Text className="text-gray-500 text-[10px] mt-0.5">{item.year}</Text>
      </View>
    </TouchableOpacity>
  );

  // Simulate loading process
  useEffect(() => {
    // Simulate a network request and show loading for 2 seconds
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  return (
    <View className="flex-1 bg-primary">
      {/* Background Image */}
      <Image
        source={images.bg}
        className="absolute w-full h-full opacity-80"
        resizeMode="cover"
      />

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          renderItem={renderBook}
          keyExtractor={(item, index) => (item?.id ?? index).toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-evenly" }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
            paddingTop: 20,
            paddingHorizontal: 10,
          }}
          ListHeaderComponent={
            <View className="pb-4">
              {/* Logo */}
              <Image
                source={icons.logo}
                className="w-12 h-10 self-center mt-20 mb-4"
                resizeMode="contain"
              />

              {/* Search Bar */}
              <SearchBar
                placeholder="Search for a book..."
                value={query}
                onChangeText={setQuery}
              />

              {/* Section Title */}
              <Text className="text-white text-lg font-bold mt-6 mb-3 px-5">
                Book Collection
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text className="text-center text-white mt-10">
              No books found for "{query}"
            </Text>
          }
        />
      )}
    </View>
  );
};

export default Save;
