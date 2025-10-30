import { AuthContext } from "@/context/AuthContext";
import { books } from "@/services/full";
import {
  checkBookSaved,
  removeSavedBook,
  saveBook,
} from "@/services/savedBooksApi";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const ReaderPage = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const authContext = useContext(AuthContext);

  // Animation values - start visible
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);

  // State
  const [isBookSaved, setIsBookSaved] = useState(false);
  const [savingBook, setSavingBook] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const book = books.find((b) => b.id === Number(id));
  const isLargeScreen = width > 700;

  // Check if book is saved
  const checkIfBookSaved = async () => {
    if (!authContext?.token || !book) return;

    try {
      const saved = await checkBookSaved(
        authContext.token,
        book!.id.toString()
      );
      setIsBookSaved(saved);
    } catch (error) {
      console.log("Could not check book save status");
    }
  };

  // Toggle save book
  const toggleSaveBook = async () => {
    if (!authContext?.token) {
      router.push("/auth/login");
      return;
    }

    setSavingBook(true);

    try {
      if (isBookSaved) {
        await removeSavedBook(authContext.token, book!.id.toString());
        setIsBookSaved(false);
      } else {
        const bookData = {
          bookId: book!.id.toString(),
          bookTitle: book!.title,
          bookAuthor: book!.author,
          bookYear: book!.year,
          bookStar: book!.star,
          bookImage: book!.image,
        };

        await saveBook(authContext.token, bookData);
        setIsBookSaved(true);
      }
    } catch (error) {
      console.error("Error saving book:", error);
    } finally {
      setSavingBook(false);
    }
  };

  // Animation on mount
  useEffect(() => {
    checkIfBookSaved();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!book) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f0f23",
          padding: 20,
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />
        <View
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            padding: 30,
            borderRadius: 25,
            alignItems: "center",
          }}
        >
          <Ionicons name="book-outline" size={64} color="white" />
          <Text style={{ color: "white", fontSize: 18, marginTop: 16 }}>
            Book not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: "#667eea",
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 15,
              marginTop: 20,
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f0f23" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f23" />

      {/* Background with Book Cover Blur */}
      <ImageBackground
        source={book.image}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: height * 0.6,
        }}
        blurRadius={20}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 15, 35, 0.85)",
          }}
        />
      </ImageBackground>

      {/* Custom Header */}
      <View
        style={{
          paddingTop: 50,
          paddingHorizontal: 20,
          paddingBottom: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            padding: 12,
            borderRadius: 15,
          }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleSaveBook}
          disabled={savingBook}
          style={{
            backgroundColor: isBookSaved
              ? "rgba(34, 197, 94, 0.2)"
              : "rgba(255, 255, 255, 0.15)",
            padding: 12,
            borderRadius: 15,
          }}
        >
          <Ionicons
            name={isBookSaved ? "heart" : "heart-outline"}
            size={24}
            color={isBookSaved ? "#22c55e" : "white"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          {/* Book Cover with 3D Effect */}
          <View
            style={{
              marginTop: 20,
              marginBottom: 30,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.5,
              shadowRadius: 30,
              elevation: 20,
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                padding: 8,
                borderRadius: 25,
              }}
            >
              <Image
                source={book.image}
                style={{
                  width: isLargeScreen ? 280 : 220,
                  height: isLargeScreen ? 380 : 320,
                  borderRadius: 20,
                }}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Book Details Card */}
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: 30,
              padding: 30,
              width: "100%",
              maxWidth: 500,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Title */}
            <Text
              style={{
                fontSize: isLargeScreen ? 32 : 28,
                fontWeight: "bold",
                color: "white",
                textAlign: "center",
                marginBottom: 12,
                lineHeight: isLargeScreen ? 40 : 36,
              }}
            >
              {book.title}
            </Text>

            {/* Author & Year */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(102, 126, 234, 0.2)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 15,
                  marginRight: 10,
                }}
              >
                <Text
                  style={{ color: "#667eea", fontSize: 14, fontWeight: "600" }}
                >
                  {book.author}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 15,
                }}
              >
                <Text
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {book.year}
                </Text>
              </View>
            </View>

            {/* Rating */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 25,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255, 215, 0, 0.2)",
                  paddingHorizontal: 15,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name="star"
                    size={16}
                    color={
                      star <= Math.floor(parseFloat(book.star || "4.5"))
                        ? "#FFD700"
                        : "rgba(255, 215, 0, 0.3)"
                    }
                    style={{ marginHorizontal: 2 }}
                  />
                ))}
                <Text
                  style={{
                    color: "#FFD700",
                    fontSize: 16,
                    fontWeight: "bold",
                    marginLeft: 8,
                  }}
                >
                  {book.star || "4.5"}
                </Text>
              </View>
            </View>

            {/* Description */}
            <View style={{ marginBottom: 30 }}>
              <Text
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: 16,
                  lineHeight: 24,
                  textAlign: "center",
                }}
              >
                {showFullDescription
                  ? book.description ||
                    "This book offers a fascinating journey through its storyline — perfect for those who love learning, inspiration, and personal growth."
                  : `${(book.description || "This book offers a fascinating journey through its storyline — perfect for those who love learning, inspiration, and personal growth.").substring(0, 150)}...`}
              </Text>
              {(book.description || "").length > 150 && (
                <TouchableOpacity
                  onPress={() => setShowFullDescription(!showFullDescription)}
                  style={{ marginTop: 10, alignSelf: "center" }}
                >
                  <Text
                    style={{
                      color: "#667eea",
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {showFullDescription ? "Show Less" : "Read More"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 15 }}>
              {/* Start Reading Button */}
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: "/BookReader",
                    params: {
                      link: book.link,
                      title: book.title,
                      bookId: book.id.toString(),
                    },
                  });
                }}
                style={{
                  backgroundColor: "#667eea",
                  paddingVertical: 18,
                  borderRadius: 25,
                  shadowColor: "#667eea",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 15,
                  elevation: 10,
                }}
                activeOpacity={0.8}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="book-outline" size={24} color="white" />
                  <Text
                    style={{
                      color: "white",
                      fontSize: 18,
                      fontWeight: "bold",
                      marginLeft: 10,
                    }}
                  >
                    Start Reading
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Secondary Actions */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={toggleSaveBook}
                  disabled={savingBook}
                  style={{
                    flex: 1,
                    backgroundColor: isBookSaved
                      ? "rgba(34, 197, 94, 0.2)"
                      : "rgba(255, 255, 255, 0.1)",
                    paddingVertical: 15,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: isBookSaved
                      ? "rgba(34, 197, 94, 0.3)"
                      : "rgba(255, 255, 255, 0.2)",
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name={isBookSaved ? "heart" : "heart-outline"}
                      size={20}
                      color={isBookSaved ? "#22c55e" : "white"}
                    />
                    <Text
                      style={{
                        color: isBookSaved ? "#22c55e" : "white",
                        fontSize: 14,
                        fontWeight: "600",
                        marginLeft: 8,
                      }}
                    >
                      {isBookSaved ? "Saved" : "Save"}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    // Share functionality could be added here
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    paddingVertical: 15,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="share-outline" size={20} color="white" />
                    <Text
                      style={{
                        color: "white",
                        fontSize: 14,
                        fontWeight: "600",
                        marginLeft: 8,
                      }}
                    >
                      Share
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Book Stats */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              marginTop: 30,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: 25,
              padding: 20,
              width: "100%",
              maxWidth: 500,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={{ color: "white", fontSize: 20, fontWeight: "bold" }}
              >
                {Math.floor(Math.random() * 500) + 100}
              </Text>
              <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 12 }}>
                Pages
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text
                style={{ color: "white", fontSize: 20, fontWeight: "bold" }}
              >
                {Math.floor(Math.random() * 10) + 5}h
              </Text>
              <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 12 }}>
                Read Time
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text
                style={{ color: "white", fontSize: 20, fontWeight: "bold" }}
              >
                {Math.floor(Math.random() * 1000) + 500}
              </Text>
              <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 12 }}>
                Readers
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default ReaderPage;
