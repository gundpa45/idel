// import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native'
// import React, { useState } from 'react'
// import { images } from '@/constants/images'
// import MoviesCard from '@/components/MoviesCard'
// import { useRouter } from 'expo-router'
// import useFetch from '@/services/useFetch'
// import { fetchMovies } from '@/services/api'
// import { icons } from '@/constants/icons'
// import SearchBar from '@/components/SearchBar'

// const Search = () => {
//   const [searchQuery, setSearchQuery] = useState('');

//   const { data: movies, loading, error } = useFetch(
//     () => fetchMovies({ query: searchQuery }),
//     false
//   );

//   return (
//     <View className="flex-1 bg-primary">
//       <Image source={images.bg} className="absolute w-full z-0" />
//       <Text>Search</Text>

//       <FlatList
//         data={movies}
//         renderItem={({ item }) => <MoviesCard {...item} />}
//         keyExtractor={(item, index) =>
//           item?.id?.toString() ?? index.toString()
//         }
//         className="px-5"
//         numColumns={3}
//         columnWrapperStyle={{
//           justifyContent: 'center',
//           gap: 5,
//           marginVertical: 16,
//         }}
//         contentContainerStyle={{ paddingBottom: 100 }}
//         ListHeaderComponent={
//           <>
//             <View className="w-full flex-row justify-center mt-20 items-center">
//               <Image source={icons.logo} className="w-12 h-10 " />
//             </View>

//             <View className="my-5">
//               <SearchBar
//                 placeholder="search movies..."
//                 value={searchQuery}
//                 onChangeText={(text: string) => setSearchQuery(text)}
//               />
//             </View>

//             {loading && (
//               <ActivityIndicator size="large" color="#000ff" className="my-3" />
//             )}

//             {error && (
//               <Text className=" text-red-500 px-5 my-3">
//                 Error: {error.message}
//               </Text>
//             )}

//             {!loading &&
//               !error &&
//               searchQuery.trim() &&
//               movies &&
//               movies.length > 0 && (
//                 <Text className="text-white">
//                   Search result for{' '}
//                   <Text className="text-accent">{searchQuery}</Text>
//                 </Text>
//               )}
//           </>
//         }
//       />
//     </View>
//   );
// };

// export default Search;


// const styles = StyleSheet.create({})


// search.tsx (Unified Search Screen for Books and Movies)
import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { images } from '@/constants/images';
import { icons } from '@/constants/icons';
import SearchBar from '@/components/SearchBar';
import { useRouter } from 'expo-router';
import useFetch from '@/services/useFetch';
import { fetchMovies } from '@/services/api';
import MoviesCard from '@/components/MoviesCard';
import { books } from '@/services/full';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const { data: movies, loading, error } = useFetch(
    () => fetchMovies({ query: searchQuery }),
    false
  );

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) {
      return books.slice(0, 9); // Show 9 books max initially
    }
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(book.year).includes(searchQuery)
    );
  }, [searchQuery]);

  const topMovies = useMemo(() => {
    if (!searchQuery.trim()) {
      return movies?.slice(0, 10) || [];
    }
    return movies || [];
  }, [movies, searchQuery]);

  const hasBooks = !searchQuery.trim() || filteredBooks.length > 0;
  const hasMovies = !searchQuery.trim() || topMovies.length > 0;

  const renderBook = ({ item }: { item: any }) => (
    <View className="w-[30%] mb-5 items-center">
      <Image
        source={item.image}
        className="w-20 h-28 rounded-md mb-1"
        resizeMode="cover"
      />
      <Text
        className="text-xs text-white text-center truncate w-20"
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.title}
      </Text>
    </View>
  );


  return (
    <View className="flex-1 bg-primary relative">
      {/* Background */}
      <Image source={images.bg} className="absolute w-full h-full z-0" resizeMode="cover" />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          minHeight: '100%',
          paddingBottom: 100,
        }}
      >
        {/* Logo */}
        <View className="flex-row justify-center mt-20 items-center">
          <Image source={icons.logo} className="w-12 h-10" resizeMode="contain" />
        </View>

        {/* Search Bar */}
        <View className="my-5">
          <SearchBar
            placeholder="Search for books or movies..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Loader */}
        {loading && (
          <ActivityIndicator size="large" color="#4F46E5" className="my-4 self-center" />
        )}

        {/* Error */}
        {error && (
          <Text className="text-red-500 px-5 my-3">Error: {error.message}</Text>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Books Section */}
            {hasBooks && (
              <View>
                <Text className="text-white text-lg font-semibold mt-6 mb-3">
                  {searchQuery.trim()
                    ? `Books for “${searchQuery}”`
                    : 'Top Recommended Books'}
                </Text>
                <FlatList
                  data={filteredBooks}
                  renderItem={renderBook}
                  keyExtractor={(item, index) => (item?.id ?? index).toString()}
                  numColumns={3}
                  columnWrapperStyle={{ justifyContent: 'space-between' }}
                  scrollEnabled={false}
                  contentContainerStyle={{ paddingBottom: 10 }}
                />
              </View>
            )}

            {/* Movies Section */}
            {hasMovies && (
              <View>
                <Text className="text-white text-lg font-semibold mt-6 mb-3">
                  {searchQuery.trim()
                    ? `Movies for “${searchQuery}”`
                    : 'Popular Movies to Watch'}
                </Text>
                <FlatList
                  data={topMovies}
                  renderItem={({ item }) => <MoviesCard {...item} />}
                  keyExtractor={(item, index) =>
                    item?.id?.toString() ?? index.toString()
                  }
                  numColumns={3}
                  columnWrapperStyle={{
                    justifyContent: 'space-between',
                    marginBottom: 20,
                    
                  }}
                  scrollEnabled={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              </View>
            )}

            {/* No Results */}
            {searchQuery.trim() && !hasBooks && !hasMovies && (
              <Text className="text-white text-center mt-6">
                No results found for “{searchQuery}”
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default Search;
