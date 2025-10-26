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


  import { StyleSheet, Text, View, Image, ScrollView, ActivityIndicator, FlatList } from 'react-native'
import React, { useState } from 'react'
import { images } from '@/constants/images'
import { icons } from '@/constants/icons'
import SearchBar from '@/components/SearchBar'
import { useRouter } from 'expo-router'
import useFetch from '@/services/useFetch'
import { fetchMovies } from '@/services/api'
import MoviesCard from '@/components/MoviesCard'

const Home = () => {
  const [dummy, setDummy] = useState("");
  const router = useRouter();

  const { data: movies, loading: moviesLoading, error: moviesError } = useFetch(() => fetchMovies({
    query: ''
  }))

  return (
    <View className="flex-1 bg-primary">
      <Image source={images.bg}
        className='absolute w-full z-0'
      />
      <ScrollView className='flex-1 px-5' showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          minHeight: "100%", paddingBottom: 10
        }}
      >
        <Image source={icons.logo}
          className='w-12 h-10 mt-20 mb-5 mx-auto'
        />

        {moviesLoading ? (
          <ActivityIndicator
            size="large"
            color="#000ff"
            className="mt-10 self-center"
          />
        ) : moviesError ? (
          <Text className="text-red-500">Error: {moviesError?.message}</Text>
        ) : (
          <View className='flex-1 mt-5'>
            <SearchBar
              placeholder="search for a movie"
              onPress={() => router.push({ pathname: "/search", params: { type: "movies" } })}
            />

            <Text className='text-lg text-white font-bold mt-5 mb-3'>Latest Movies</Text>
            <FlatList
              data={movies?.slice(0, 10) || []}
              renderItem={({ item }) => (
                <MoviesCard
                  {...item}
                />
              )}
              keyExtractor={(item) => item.id.toString()}
              numColumns={3}
              columnWrapperStyle={{
                justifyContent: 'flex-start',
                gap: 20,
                paddingRight: 5,
                marginBottom: 10
              }}
              className='pb-32'
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default Home

const styles = StyleSheet.create({})