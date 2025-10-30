import { API_BASE_URL } from "../config";

// Get user's saved books
export const fetchSavedBooks = async (token) => {
  if (!token) {
    return [];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/saved-books`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch saved books");
    }

    return data.data || [];
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection.");
    }
    if (error.message.includes("Network request failed")) {
      throw new Error(
        "Unable to connect to server. Please check your connection."
      );
    }
    console.error("Error fetching saved books:", error);
    throw error;
  }
};

// Save a book
export const saveBook = async (token, bookData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-books/save`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to save book");
    }

    return data;
  } catch (error) {
    console.error("Error saving book:", error);
    throw error;
  }
};

// Remove a saved book
export const removeSavedBook = async (token, bookId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/saved-books/remove/${bookId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to remove saved book");
    }

    return data;
  } catch (error) {
    console.error("Error removing saved book:", error);
    throw error;
  }
};

// Check if a book is saved
export const checkBookSaved = async (token, bookId) => {
  // If no token, return false immediately (user not logged in)
  if (!token) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(
      `${API_BASE_URL}/saved-books/check/${bookId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to check saved book");
    }

    return data.isSaved || false;
  } catch (error) {
    // Silently handle network errors to avoid spamming console
    if (
      error.name === "AbortError" ||
      error.message.includes("Network request failed")
    ) {
      return false;
    }
    console.error("Error checking saved book:", error);
    return false; // Return false on error to be safe
  }
};
