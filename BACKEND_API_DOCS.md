# Backend API Documentation

This document describes the required backend API endpoints for the book reader highlighting functionality.

## Base URL
```
http://YOUR_IP:5000/api
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <token>
```

---

## Highlights Endpoints

### 1. Get Highlights (Filtered by User and Book)
**GET** `/highlights`

**Query Parameters:**
- `userId` (required): The ID of the logged-in user
- `bookId` (required): The ID of the current book

**Response:**
```json
[
  {
    "id": "highlight_123",
    "text": "This is the highlighted text",
    "bookId": "book_456",
    "bookTitle": "Sample Book Title",
    "userId": "user_789",
    "color": "#fef9c3",
    "page": 42,
    "createdAt": "2025-10-24T10:30:00Z",
    "updatedAt": "2025-10-24T10:30:00Z"
  }
]
```

---

### 2. Create Highlight
**POST** `/highlights`

**Request Body:**
```json
{
  "text": "The highlighted text",
  "userId": "user_789",
  "bookId": "book_456",
  "bookTitle": "Sample Book Title",
  "color": "#fef9c3",
  "page": 42,
  "createdAt": "2025-10-24T10:30:00Z"
}
```

**Response:**
```json
{
  "id": "highlight_123",
  "text": "The highlighted text",
  "bookId": "book_456",
  "bookTitle": "Sample Book Title",
  "userId": "user_789",
  "color": "#fef9c3",
  "page": 42,
  "createdAt": "2025-10-24T10:30:00Z",
  "updatedAt": "2025-10-24T10:30:00Z"
}
```

---

### 3. Delete Highlight
**DELETE** `/highlights/:id`

**URL Parameters:**
- `id`: The highlight ID to delete

**Response:**
```json
{
  "success": true,
  "message": "Highlight deleted successfully"
}
```

---

## Book Stats Endpoints

### 4. Get Book Stats
**GET** `/book-stats`

**Query Parameters:**
- `userId` (required): The ID of the logged-in user
- `bookId` (required): The ID of the current book

**Response:**
```json
{
  "id": "stats_001",
  "bookId": "book_456",
  "userId": "user_789",
  "bookTitle": "Sample Book Title",
  "currentPage": 42,
  "totalPages": 300,
  "progress": 14,
  "lastReadAt": "2025-10-24T10:30:00Z",
  "highlightsCount": 5,
  "notesCount": 2
}
```

---

### 5. Create Book Stats
**POST** `/book-stats`

**Request Body:**
```json
{
  "userId": "user_789",
  "bookId": "book_456",
  "bookTitle": "Sample Book Title",
  "currentPage": 1,
  "totalPages": 300,
  "lastReadAt": "2025-10-24T10:30:00Z",
  "highlightsCount": 0,
  "notesCount": 0
}
```

**Response:**
```json
{
  "id": "stats_001",
  "bookId": "book_456",
  "userId": "user_789",
  "bookTitle": "Sample Book Title",
  "currentPage": 1,
  "totalPages": 300,
  "progress": 0,
  "lastReadAt": "2025-10-24T10:30:00Z",
  "highlightsCount": 0,
  "notesCount": 0
}
```

---

### 6. Update Book Stats
**PUT** `/book-stats`

**Request Body:**
```json
{
  "userId": "user_789",
  "bookId": "book_456",
  "currentPage": 42,
  "lastReadAt": "2025-10-24T10:30:00Z",
  "highlightsCount": 5
}
```

**Response:**
```json
{
  "id": "stats_001",
  "bookId": "book_456",
  "userId": "user_789",
  "bookTitle": "Sample Book Title",
  "currentPage": 42,
  "totalPages": 300,
  "progress": 14,
  "lastReadAt": "2025-10-24T10:30:00Z",
  "highlightsCount": 5,
  "notesCount": 2
}
```

---

## Database Schema Suggestions

### Highlights Table
```sql
CREATE TABLE highlights (
  id VARCHAR(255) PRIMARY KEY,
  text TEXT NOT NULL,
  book_id VARCHAR(255) NOT NULL,
  book_title VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  color VARCHAR(50) DEFAULT '#fef9c3',
  page INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_book (user_id, book_id)
);
```

### Book Stats Table
```sql
CREATE TABLE book_stats (
  id VARCHAR(255) PRIMARY KEY,
  book_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  book_title VARCHAR(255) NOT NULL,
  current_page INT DEFAULT 0,
  total_pages INT,
  progress INT DEFAULT 0,
  last_read_at TIMESTAMP NOT NULL,
  highlights_count INT DEFAULT 0,
  notes_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_book (user_id, book_id)
);
```

---

## Error Responses

All endpoints should return appropriate error responses:

**401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

**404 Not Found**
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Notes

1. **User Authentication**: The `userId` should be extracted from the JWT token in the backend, not trusted from the client request body.

2. **Data Linking**: Highlights are linked to both users and books, allowing:
   - Users to see all their highlights across books
   - Users to see highlights for a specific book
   - Book statistics tracking per user

3. **Progress Calculation**: The `progress` field in book stats can be calculated as:
   ```javascript
   progress = Math.round((currentPage / totalPages) * 100)
   ```

4. **Cascade Deletes**: Consider implementing cascade deletes:
   - When a user is deleted, delete their highlights and book stats
   - Optionally, when a book is removed, delete associated highlights and stats

