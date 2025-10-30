  // import { StyleSheet, Text, View ,Image, ScrollView, ActivityIndicator, FlatList} from 'react-native'
  // import React, { useState } from 'react'
  // import { images } from '@/constants/images'
  // import { icons } from '@/constants/icons'
  // import SearchBar from '@/components/SearchBar'
  // import { useRouter } from 'expo-router'
  // import useFetch from '@/services/useFetch'
  // import { fetchMovies } from '@/services/api'
  // import MoviesCard from '@/components/MoviesCard'





  // const Home = () => {
  //   const [dummy, setDummy] = useState("");
  //   const router = useRouter();

  //   const  {data : movies ,
  //     loading:moviesLoading,
  //     error:moviesError
  //   } = useFetch(()=> fetchMovies({
  //     query:''
  //   }))

  //   return (
  //   <View  className="flex-1 bg-primary ">
  //   <Image source={images.bg} 
  //   className=' absolute w-full z-0 '
  //   />
  //     <ScrollView className='flex-1 px-5' showsHorizontalScrollIndicator={false}
  //     contentContainerStyle={{
  //       minHeight:"100%",paddingBottom:10
  //     }}
  //     >
  //     <Image source={icons.logo} 
  //     className='w-12 h-10 mt-20 mb-5 mx-auto'
  //     />



  //       {moviesLoading ? (

  //         <ActivityIndicator
  //         size="large"
  //         color="#000ff" 
  //         className=" mt-10 self-center"
  //         />
  //       ): moviesError? (
  //         <Text> Error : ${moviesError?.message}</Text>
  //       )  :
  //       <View className='flex-1 mt-5 '>
  //       <SearchBar
  //         placeholder="search for a movie"
  //         // value={dummy}
  //         // onChangeText={setDummy}
  //         onPress={() => router.push("/serach")}
  // />
        
  //       <>
  //       <Text className='text-lg text-white font-bold mt-5 mb-3'> latest Movies</Text>
  //       <FlatList 
        
  //       data={movies}
  //       renderItem={({item})=>(
  //         // <Text className='text-white text-sm '>{item.title}</Text>
  //         <MoviesCard
  //           {...item}
  //         />

  //       )}
  //       keyExtractor={(item)=>item.id.toString()}
  //       numColumns={3}
  //       columnWrapperStyle={{
  //         justifyContent:'flex-start',
  //         gap:20,
  //         paddingRight:5,
  //         marginBottom:10
  //       }}
  //       className='mt-w pb-32  '
  //       scrollEnabled={false}
  //       />
        
  //       </>
          
  //         </View> 
        
  //       }
  //     </ScrollView>
  //     </View>
  //   )
  // }

  // export default Home

  // const styles = StyleSheet.create({})


import ReadingProgressTracker from '@/components/ReadingProgressTracker'
import ReadingRecommendations from '@/components/ReadingRecommendations'
import SearchBar from '@/components/SearchBar'
import { icons } from '@/constants/icons'
import { images } from '@/constants/images'
import { AuthContext } from '@/context/AuthContext'
import { useParentalControls } from '@/context/ParentalControlContext'
import { books } from '@/services/full'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useContext, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const Home = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedBookIds, setSavedBookIds] = useState([]);
  const router = useRouter();
  const authContext = useContext(AuthContext);
  
  const parentalControls = useParentalControls();

  // Load saved book IDs from database
  const loadSavedBooks = async () => {
    try {
      if (!authContext?.token) {
        console.log('No auth token, skipping saved books load');
        return;
      }

      // For now, we'll check each book individually
      // In a real app, you might want to fetch all saved book IDs at once
      const savedIds = [];
      for (const book of books.slice(0, 10)) { // Check first 10 books for performance
        const isSaved = await checkBookSaved(authContext.token, book.id.toString());
        if (isSaved) {
          savedIds.push(book.id.toString());
        }
      }
      setSavedBookIds(savedIds);
    } catch (error) {
      console.error('Error loading saved books:', error);
    }
  };

  // Save/Unsave book
  const toggleSaveBook = async (book) => {
    try {
      if (!authContext?.token) {
        Alert.alert(
          'Login Required', 
          'Please login to save books and sync across devices',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => router.push('/auth/login') }
          ]
        );
        return;
      }

      const bookId = book.id.toString();
      
      if (savedBookIds.includes(bookId)) {
        // Remove from saved
        await removeSavedBook(authContext.token, bookId);
        setSavedBookIds(prev => prev.filter(id => id !== bookId));
        Alert.alert('Removed', 'Book removed from your reading list');
      } else {
        // Add to saved
        const bookData = {
          bookId: bookId,
          bookTitle: book.title,
          bookAuthor: book.author,
          bookYear: book.year,
          bookStar: book.star,
          bookImage: book.image
        };
        
        await saveBook(authContext.token, bookData);
        setSavedBookIds(prev => [...prev, bookId]);
        Alert.alert('Saved!', 'Book added to your reading list');
      }
    } catch (error) {
      console.error('Error saving book:', error);
      Alert.alert('Error', error.message || 'Failed to save book');
    }
  };

  // Get screen dimensions for responsive design
  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 60) / 3; // 3 items per row with padding

  // 🔍 Filter books by title or author
  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(query.toLowerCase()) ||
      book.author.toLowerCase().includes(query.toLowerCase())
  );

  // Check if user is a child with parental controls
  const isChildAccount = authContext?.user?.accountType === 'child';
  const hasParentalControls = isChildAccount && authContext?.user?.parentId && parentalControls;

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedBooks(); // Reload saved books
    setRefreshing(false);
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
          
          {/* Bookmark Button */}
          <TouchableOpacity
            onPress={() => toggleSaveBook(item)}
            className="absolute top-2 left-2 bg-black/70 rounded-full p-2"
          >
            <Ionicons 
              name={savedBookIds.includes(item.id.toString()) ? "bookmark" : "bookmark-outline"} 
              size={12} 
              color={savedBookIds.includes(item.id.toString()) ? "#FFD700" : "white"} 
            />
          </TouchableOpacity>
          
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
          <View className="bg-blue-500/20 rounded-full px-2 py-0.5">
            <Text className="text-blue-300 text-[8px] font-medium">BROWSE</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Load saved books and simulate loading process
  useEffect(() => {
    const initializeData = async () => {
      await loadSavedBooks();
      // Simulate a network request and show loading for 1 second
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };
    
    initializeData();
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
          <Text className="text-white text-base mt-4 font-medium">Loading book library...</Text>
          <Text className="text-gray-300 text-sm mt-1">Discovering amazing books for you</Text>
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
              {/* Logo */}
              <Image source={icons.logo}
                className='w-12 h-10 mt-16 mb-6 mx-auto'
              />

              {/* Enhanced Header */}
              <View className="flex-row items-center justify-between mb-6">
                <View>
                  <Text className="text-white text-2xl font-bold">Discover Books</Text>
                  <Text className="text-gray-300 text-sm mt-1">
                    {filteredBooks.length} books available to explore
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

              {/* Show parental control features for child accounts */}
              {hasParentalControls && (
                <View className="mb-6">
                  <ReadingProgressTracker 
                    userId={authContext?.user?.id?.toString()}
                    showDetailedStats={false}
                  />
                  <ReadingRecommendations 
                    userId={authContext?.user?.id?.toString()}
                    showParentRecommendations={true}
                  />
                </View>
              )}

              {/* Collection Stats Card */}
              <View className="bg-white/10 rounded-2xl p-4 mb-6 backdrop-blur-sm">
                <View className="flex-row justify-between items-center">
                  <View className="items-center flex-1">
                    <Text className="text-white text-xl font-bold">
                      {filteredBooks.length}
                    </Text>
                    <Text className="text-gray-300 text-xs">Available Books</Text>
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
                placeholder="Search for books to read..."
                value={query}
                onChangeText={setQuery}
              />

              {/* Section Header */}
              <View className="flex-row items-center justify-between mt-6 mb-4">
                <Text className="text-white text-lg font-bold">Browse Library</Text>
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
                <Text className="text-white text-lg font-semibold mb-2">No Books Available</Text>
                <Text className="text-gray-300 text-center px-8">
                  We're working on adding more books to our library.
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            filteredBooks.length > 0 ? (
              <View className="items-center py-8">
                <Text className="text-gray-400 text-sm">
                  📚 Discover your next favorite book!
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  )
}

export default Home

const styles = StyleSheet.create({})