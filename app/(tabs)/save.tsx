import SearchBar from "@/components/SearchBar";
import { images } from "@/constants/images";
import { AuthContext } from "@/context/AuthContext";
import { fetchSavedBooks, removeSavedBook } from "@/services/savedBooksApi";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from "react-native";

const Save = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedBooks, setSavedBooks] = useState([]);
  const router = useRouter();
  const authContext = useContext(AuthContext);

  // Get screen dimensions for responsive design
  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 60) / 3; // 3 items per row with padding

  // Load saved books from database
  const loadSavedBooks = async () => {
    try {
      if (!authContext?.token) {
        console.log('No auth token, skipping saved books load');
        setLoading(false);
        return;
      }

      const savedBooksData = await fetchSavedBooks(authContext.token);
      setSavedBooks(savedBooksData || []);
      console.log('Loaded saved books:', savedBooksData?.length || 0);
    } catch (error) {
      console.error('Error loading saved books:', error);
      // Don't show alert for network errors - just work offline
      setSavedBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter saved books by search query
  const filteredSavedBooks = savedBooks.filter(
    (book) =>
      book.bookTitle.toLowerCase().includes(query.toLowerCase()) ||
      book.bookAuthor.toLowerCase().includes(query.toLowerCase())
  );

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedBooks();
    setRefreshing(false);
  };

  // Remove book from saved list
  const removeFromSaved = async (bookId) => {
    try {
      if (!authContext?.token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      await removeSavedBook(authContext.token, bookId);
      setSavedBooks(prev => prev.filter(book => book.bookId !== bookId));
      Alert.alert('Removed', 'Book removed from your reading list');
    } catch (error) {
      console.error('Error removing book:', error);
      Alert.alert('Error', error.message || 'Failed to remove book');
    }
  };

  // Load saved books on component mount and when auth changes
  useEffect(() => {
    loadSavedBooks();
  }, [authContext?.token]);



  // 📖 Render each saved book card with remove option
  const renderSavedBook = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: `/reader/${item.bookId}`,
          params: {
            id: item.bookId,
            title: item.bookTitle,
            author: item.bookAuthor,
            year: item.bookYear,
            star: item.bookStar,
            link: item.link || '',
            description: item.description || '',
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
            source={{ uri: item.bookImage }}
            className="w-full h-40"
            resizeMode="cover"
          />
          {/* Gradient Overlay */}
          <View className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Remove Button */}
          <TouchableOpacity
            onPress={() => removeFromSaved(item.bookId)}
            className="absolute top-2 left-2 bg-red-500/80 rounded-full p-1"
          >
            <Ionicons name="close" size={12} color="white" />
          </TouchableOpacity>
          
          {/* Rating Badge */}
          <View className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-1 flex-row items-center">
            <Ionicons name="star" size={10} color="#FFD700" />
            <Text className="text-white text-[9px] font-semibold ml-1">{item.bookStar}</Text>
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
          {item.bookTitle}
        </Text>

        <Text className="text-gray-400 text-[9px] mt-1" numberOfLines={1}>
          by {item.bookAuthor}
        </Text>

        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-gray-500 text-[8px]">{item.bookYear}</Text>
          <View className="bg-green-500/20 rounded-full px-2 py-0.5">
            <Text className="text-green-300 text-[8px] font-medium">SAVED</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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
            <Ionicons name="bookmark-outline" size={48} color="white" />
          </View>
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white text-base mt-4 font-medium">Loading your saved books...</Text>
          <Text className="text-gray-300 text-sm mt-1">Please wait while we fetch your reading list</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSavedBooks}
          renderItem={renderSavedBook}
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
                  <Text className="text-white text-2xl font-bold">My Reading List</Text>
                  <Text className="text-gray-300 text-sm mt-1">
                    {filteredSavedBooks.length} books saved for later
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
                      {savedBooks.length}
                    </Text>
                    <Text className="text-gray-300 text-xs">Saved Books</Text>
                  </View>
                  <View className="w-px h-6 bg-white/20" />
                  <View className="items-center flex-1">
                    <Text className="text-white text-xl font-bold">
                      {Math.ceil(savedBooks.length / 3)}
                    </Text>
                    <Text className="text-gray-300 text-xs">Rows</Text>
                  </View>
                  <View className="w-px h-6 bg-white/20" />
                  <View className="items-center flex-1">
                    <Text className="text-white text-xl font-bold">
                      {new Date().toLocaleDateString('en-US', { month: 'short' })}
                    </Text>
                    <Text className="text-gray-300 text-xs">Updated</Text>
                  </View>
                </View>
              </View>

              {/* Search Bar */}
              <SearchBar
                placeholder="Search your saved books..."
                value={query}
                onChangeText={setQuery}
              />

              {/* Section Header */}
              <View className="flex-row items-center justify-between mt-6 mb-4">
                <Text className="text-white text-lg font-bold">Your Reading List</Text>
                <View className="flex-row items-center">
                  <Ionicons name="bookmark-outline" size={16} color="#9CA3AF" />
                  <Text className="text-gray-300 text-sm ml-1">Tap × to remove</Text>
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
                  No saved books found for "{query}". Try a different search term.
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
                  <Ionicons name={!authContext?.token ? "log-in-outline" : "bookmark-outline"} size={48} color="white" />
                </View>
                <Text className="text-white text-lg font-semibold mb-2">
                  {!authContext?.token ? "Login Required" : "No Books Saved Yet"}
                </Text>
                <Text className="text-gray-300 text-center px-8 leading-6">
                  {!authContext?.token 
                    ? "Please login to save books and sync your reading list across devices."
                    : "Start building your reading list by saving books from the home page. Look for the bookmark icon on each book!"
                  }
                </Text>
                <TouchableOpacity
                  onPress={() => router.push(!authContext?.token ? '/auth/login' : '/(tabs)/')}
                  className="bg-white/20 px-6 py-3 rounded-full mt-4"
                >
                  <Text className="text-white font-medium">
                    {!authContext?.token ? "Login Now" : "Browse Books"}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }
          ListFooterComponent={
            filteredSavedBooks.length > 0 ? (
              <View className="items-center py-8">
                <Text className="text-gray-400 text-sm">
                  📚 Happy reading! Tap books to start reading.
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
