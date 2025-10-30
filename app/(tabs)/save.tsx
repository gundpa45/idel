import SearchBar from "@/components/SearchBar";
import { images } from "@/constants/images";
import { books } from "@/services/full";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from "react-native";

const Save = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  
  // Get screen dimensions for responsive design
  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 60) / 3; // 3 items per row with padding

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

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // 📖 Render each book card with clean 3-column layout
  const renderBook = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.8}
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
      className="flex-1 mx-1 mb-4"
      style={{ maxWidth: '31%' }}
    >
      {/* Book Cover with Enhanced Design */}
      <View className="rounded-2xl overflow-hidden shadow-lg shadow-black/50 bg-[#1a1a2e]">
        <View className="relative">
          <Image
            source={item.image}
            className="w-full h-40"
            resizeMode="cover"
          />
          {/* Gradient Overlay */}
          <View className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Rating Badge */}
          <View className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-1 flex-row items-center">
            <Ionicons name="star" size={10} color="#FFD700" />
            <Text className="text-white text-[9px] font-semibold ml-1">{item.star}</Text>
          </View>
        </View>
      </View>

      {/* Book Info with Better Spacing */}
      <View className="mt-3 px-1">
        <Text
          className="text-white text-[11px] font-bold leading-4"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>

        <Text className="text-gray-400 text-[9px] mt-1" numberOfLines={1}>
          by {item.author}
        </Text>

        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-gray-500 text-[8px]">{item.year}</Text>
          <View className="bg-white/10 rounded-full px-2 py-0.5">
            <Text className="text-white text-[8px] font-medium">SAVED</Text>
          </View>
        </View>
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
      {/* Enhanced Background with Gradient */}
      <Image
        source={images.bg}
        className="absolute w-full h-full opacity-70"
        resizeMode="cover"
      />
      <View className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/70 to-primary/90" />

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <View className="bg-white/10 rounded-full p-6 mb-4">
            <Ionicons name="library-outline" size={48} color="white" />
          </View>
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white text-base mt-4 font-medium">Loading your library...</Text>
          <Text className="text-gray-300 text-sm mt-1">Please wait while we fetch your books</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          renderItem={renderBook}
          keyExtractor={(item, index) => (item?.id ?? index).toString()}
          numColumns={3}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            paddingHorizontal: 10,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
              colors={['white']}
            />
          }
          contentContainerStyle={{
            paddingBottom: 120,
            paddingTop: 20,
            paddingHorizontal: 10,
          }}
          ListHeaderComponent={
            <View className="pb-6">
              {/* Enhanced Header */}
              <View className="flex-row items-center justify-between mt-16 mb-6">
                <View>
                  <Text className="text-white text-2xl font-bold">My Library</Text>
                  <Text className="text-gray-300 text-sm mt-1">
                    {filteredBooks.length} books in your collection
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onRefresh}
                  className="bg-white/20 p-3 rounded-full"
                  disabled={refreshing}
                >
                  <Ionicons 
                    name={refreshing ? "refresh" : "refresh-outline"} 
                    size={24} 
                    color="white" 
                  />
                </TouchableOpacity>
              </View>

              {/* Collection Stats Card */}
              <View className="bg-white/10 rounded-2xl p-4 mb-6 backdrop-blur-sm">
                <View className="flex-row justify-between items-center">
                  <View className="items-center flex-1">
                    <Text className="text-white text-xl font-bold">
                      {filteredBooks.length}
                    </Text>
                    <Text className="text-gray-300 text-xs">Total Books</Text>
                  </View>
                  <View className="w-px h-6 bg-white/20" />
                  <View className="items-center flex-1">
                    <Text className="text-white text-xl font-bold">
                      {Math.ceil(filteredBooks.length / 3)}
                    </Text>
                    <Text className="text-gray-300 text-xs">Rows</Text>
                  </View>
                  <View className="w-px h-6 bg-white/20" />
                  <View className="items-center flex-1">
                    <Text className="text-white text-xl font-bold">3</Text>
                    <Text className="text-gray-300 text-xs">Per Row</Text>
                  </View>
                </View>
              </View>

              {/* Search Bar */}
              <SearchBar
                placeholder="Search your library..."
                value={query}
                onChangeText={setQuery}
              />

              {/* Section Header */}
              <View className="flex-row items-center justify-between mt-6 mb-4">
                <Text className="text-white text-lg font-bold">Your Collection</Text>
                <View className="flex-row items-center">
                  <Ionicons name="grid-outline" size={16} color="#9CA3AF" />
                  <Text className="text-gray-300 text-sm ml-1">3×{Math.ceil(filteredBooks.length / 3)} grid</Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            query ? (
              <View className="flex-1 justify-center items-center py-20">
                <View className="bg-white/10 rounded-full p-6 mb-4">
                  <Ionicons name="search-outline" size={48} color="white" />
                </View>
                <Text className="text-white text-lg font-semibold mb-2">No Results Found</Text>
                <Text className="text-gray-300 text-center px-8">
                  No books found for "{query}". Try a different search term.
                </Text>
                <TouchableOpacity
                  onPress={() => setQuery("")}
                  className="bg-white/20 px-6 py-3 rounded-full mt-4"
                >
                  <Text className="text-white font-medium">Clear Search</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-1 justify-center items-center py-20">
                <View className="bg-white/10 rounded-full p-6 mb-4">
                  <Ionicons name="library-outline" size={48} color="white" />
                </View>
                <Text className="text-white text-lg font-semibold mb-2">No Books Saved</Text>
                <Text className="text-gray-300 text-center px-8">
                  Start building your library by saving books you want to read later.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/')}
                  className="bg-white/20 px-6 py-3 rounded-full mt-4"
                >
                  <Text className="text-white font-medium">Browse Books</Text>
                </TouchableOpacity>
              </View>
            )
          }
          ListFooterComponent={
            filteredBooks.length > 0 ? (
              <View className="items-center py-8">
                <Text className="text-gray-400 text-sm">
                  📚 Keep discovering amazing books!
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

export default Save;
