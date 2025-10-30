// The import for 'atomic' was removed because it was unused.

export interface Book {
  id: number;
  title: string;
  image: any;
  author: string;
  year: string;
  star?: string;
  link: string | any;
  description?: string;
}

export const books: Book[] = [
  {
    id: 1,
    title: "Atomic Habits",
    image: require("../assets/images/Atomic Habits.jpg"),
    author: "James Clear",
    year: "2018",
    star: "5",
    link: "https://drive.google.com/uc?export=download&id=1ManmSHE-csYijkv553nYEMzvGI0RK6fe",
    description:
      "Atomic Habits provides practical strategies to form good habits, break bad ones, and master the small behaviors that lead to remarkable results.",
  },
  {
    id: 2,
    title: "The Laws of Human Nature",
    image: require("../assets/images/law of human nature (cover page ).jpg"),
    author: "Robert Greene",
    year: "2018",
    star: "5",
    link: "https://drive.google.com/uc?export=download&id=1ojXF4VfbVdlvFNVnOUY-1JJKBBIpMQmE",
    description:
      "Robert Greene explores the underlying motivations driving human behavior, offering deep insights into understanding people and mastering social intelligence.",
  },
  {
    id: 3,
    title: "Harry Potter and the Philosopher’s Stone",
    image: require("../assets/images/Harry Potter and the Philosopher's Stone.jpg"),
    author: "J.K. Rowling",
    year: "1997",
    star: "5",
    link: "https://drive.google.com/uc?export=download&id=185zsCOeqTBUv5mZx-TS3TIj67XhyD5vL",
    description:
      "The first book in the Harry Potter series follows a young boy who discovers he’s a wizard and begins his journey at Hogwarts School of Witchcraft and Wizardry.",
  },
  {
    id: 4,
    title:
      "That Will Never Work: The Birth of Netflix and the Amazing Life of an Idea",
    image: require("../assets/images/that will never work (Cover_page).jpg"),
    author: "Marc Randolph",
    year: "2019",
    star: "4",
    link: "https://drive.google.com/uc?export=download&id=1_XknvGdiAKJX_g6YmA1eRBy-EBVeCbrf",
    description:
      "Netflix co-founder Marc Randolph shares the inspiring story of how the world’s top streaming service began, offering lessons in creativity, resilience, and innovation.",
  },
  {
    id: 5,
    title: "haikyuu",
    image: require("../assets/images/haikyu.png"),
    author: "Mark Manson",
    year: "2019",
    star: "4",
    link: "https://t.me/haikyuu_manga_english/505", // CORRECTED: This is a placeholder, you need to replace it.
    description:
      "In this thought-provoking follow-up to 'The Subtle Art of Not Giving a F*ck', Mark Manson examines hope, meaning, and the challenges of modern life.",
  },
  {
    id: 6,
    title: "Give and Take: A Revolutionary Approach to Success",
    image: require("../assets/images/give and take (cover_page).jpg"),
    author: "Adam Grant",
    year: "2013",
    star: "4",
    link: "https://drive.google.com/uc?export=download&id=1mHr43O1iYWKT4BazDuifJCzOLEJAIuM8",
    description:
      "Adam Grant explores how success depends on how we interact with others — showing that generous people often achieve the greatest long-term success.",
  },
  {
    id: 7,
    title: "Say You'll Be Mine",
    image: require("../assets/images/Say you .png"),
    author: "Naina Kumar",
    year: "2021",
    star: "4",
    link: "https://drive.google.com/uc?export=download&id=1mHr43O1iYWKT4BazDuifJCzOLEJAIuM8",
    description:
      "A heartfelt romance novel that explores love, destiny, and second chances, reminding readers that true love always finds its way back.",
  },
  {
    id: 8,
    title: "Beyond This Heaven",
    image: require("../assets/images/beyond this heaven.png"),
    author: "Bhavini K. Desai",
    year: "2020",
    star: "4",
    link: "https://drive.google.com/uc?export=download&id=1b4NkrW_Grhoj0kNF6hRThMXG-n8BvLXR",
    description:
      "A captivating story of love, loss, and self-discovery, ‘Beyond This Heaven’ takes readers on an emotional journey of healing and inner strength.",
  },
  {
    id: 9,
    title: "Destroy Me", // CORRECTED: Typo in title
    image: require("../assets/images/Destory Me.jpg"), // ACTION: Move this image to your assets folder
    author: "Tahereh Mafi",
    year: "2016",
    star: "4.5",
    link: "https://drive.google.com/file/d/1GceYWusZG0nqvkfbXkToCpzC1Bl3oX3b/preview",
    description:
      "This novella, told from the perspective of Warner, bridges the gap between 'Shatter Me' and 'Unravel Me', revealing his inner thoughts and motivations.", // CORRECTED: Description was wrong
  },
  {
    id: 10,
    title: "Unravel Me",
    image: require("../assets/images/Unravel Me.jpg"), // ACTION: Move this image to your assets folder
    author: "Tahereh Mafi",
    year: "2013",
    star: "4.1",
    link: "https://drive.google.com/file/d/1qpsUdaYSI2bhtBp8ANfGpfgnPV1SNlhg/preview",
    description:
      "Unravel Me by Tahereh Mafi continues Juliette’s story as she learns to control her deadly touch and navigate the fragile balance between love, power, and survival.",
  },
  {
    id: 11,
    title: "Shatter Me",
    image: require("../assets/images/Shatter ME'.jpg"), // ACTION: Move this image to your assets folder
    author: "Tahereh Mafi", // CORRECTED: Mismatched quotes
    year: "2011",
    star: "4",
    link: "https://drive.google.com/file/d/1gqfI03Bse8D8lEIwJmQgl9UbNhSwKx-u/preview",
    description:
      "Shatter Me by Tahereh Mafi (2011) — A gripping dystopian romance about Juliette, a girl whose deadly touch becomes her greatest weapon.",
  },
  {
    id: 12,
    title: "Twisted Hate",
    image: require("../assets/images/Twisted Hate.jpg"), // ACTION: Move this image to your assets folder
    author: "Ana Huang",
    year: "2022",
    star: "4",
    link: "https://drive.google.com/file/d/1Xb3UQ4k9rDEtP15EBkY78yU0sPtS5HOH/preview",
    description:
      "Gorgeous, cocky, and fast on his way to becoming a hotshot doctor, Josh Chen has never met a woman he couldn’t charm—except for Jules. When their animosity explodes into one unforgettable night, he proposes an enemies-with-benefits arrangement with simple rules.",
  },
  {
    id: 13,
    title: "Twisted Lies",
    image: require("../assets/images/Twisted Lies.jpg"), // ACTION: Move this image to your assets folder
    author: "Ana Huang", // CORRECTED: Mismatched quotes
    year: "2022",
    star: "4.3",
    link: "https://drive.google.com/file/d/1aNY7FWA6QheHbhTh0-B1QS3NyUHVrwlD/preview",
    description:
      "Sweet, shy and introverted despite her social media fame, Stella Alonso must trust the dangerous man one floor above if she’s to survive his world of secrets.",
  },
  {
    id: 14,
    title: "Ignite Me",
    image: require("../assets/images/ignite me.jpg"), // ACTION: Move this image to your assets folder
    author: "Tahereh Mafi", // CORRECTED: Typo in author name
    year: "2014",
    star: "4.32",
    link: "https://drive.google.com/file/d/1wh-Tk4VxOgCoRvFdrZJemXRY5yAlTYpA/preview",
    description:
      "With Omega Point destroyed, Juliette doesn’t know if the rebels, her friends, or even Adam are alive. She must rely on Warner, the one person she never thought she could trust.",
  },
  {
    id: 15,
    title: "Twisted Game",
    image: require("../assets/images/twisted game.jpg"), // ACTION: Move this image to your assets folder
    author: "Ana Huang",
    year: "2021",
    star: "5",
    link: "https://drive.google.com/file/d/1u_A7TYSpmszGvb3YTi-iuEM9WVrpkuT5/preview",
    description:
      "Elite bodyguard Rhys Larsen has two rules: protect his client and never get emotionally involved. Until he meets Princess Bridget von Ascheberg — his job becomes impossible.",
  },
  {
    id: 16,
    title: "Twisted Love",
    image: require("../assets/images/twisted love.jpg"), // ACTION: Move this image to your assets folder
    author: "Ana Huang",
    year: "2022",
    star: "3.71",
    link: "https://drive.google.com/file/d/1WL0FuVbrCX1zVJ8yBjcyRNkVLHGvKL83/preview",
    description:
      "Alex Volkov is a devil blessed with the face of an angel and cursed by his past. Ava Chen, free-spirited but haunted, unexpectedly becomes the one who might thaw his ice-cold world.",
  },
  {
    id: 17,
    title: "Imagine Me",
    image: require("../assets/images/imagine me.jpg"), // ACTION: Move this image to your assets folder
    author: "Tahereh Mafi",
    year: "2020",
    star: "4.01", // CORRECTED: Mismatched quotes
    link: "https://drive.google.com/file/d/1yhG8pwI-OokWQ487BF5OpRb2VVVHRQ8A/preview", // CORRECTED: Mismatched quotes
    description:
      "Now that Ella knows who Juliette is and what she was created for, things have only become more complicated.",
  },
  {
    id: 18,
    title: "The Wicked King",
    image: require("../assets/images/the wicked king.jpg"), // ACTION: Move this image to your assets folder
    author: "Holly Black",
    year: "2019",
    star: "4",
    link: "https://drive.google.com/file/d/1sIlYFexDnn7rYAu52oJmkCsPyLuT586j/preview", // CORRECTED: Removed extra 'j' at the end
    description:
      "After securing the Faerie throne, mortal Jude Duarte must keep her younger brother safe while navigating deadly court intrigue — all while bound to the wicked King Cardan.",
  },
  {
    id: 19,
    title: "The Queen of Nothing",
    image: require("../assets/images/the queen of nothing.jpg"), // ACTION: Move this image to your assets folder
    author: "Holly Black",
    year: "2019",
    star: "4.32",
    link: "https://drive.google.com/file/d/1p3t2Vx2pJ28pVI2p8oxbnzziW72y59CX/preview",
    description:
      "Exiled and stripped of power, mortal-queen-turned-outcast Jude must return to the treacherous Faerie Court to reclaim her throne and confront the High King she once betrayed.",
  },
  {
    id: 20,
    title: "Shadow Me",
    image: require("../assets/images/shadow me .jpg"), // ACTION: Move this image to your assets folder
    author: "Tahereh Mafi",
    year: "2019",
    star: "3.5",
    link: "https://drive.google.com/uc?export=view&id=1LEd6RpNp-tg8zPNgmjaK-lOvDLAwWd4l",
    description:
      "Narrated by Kenji Kishimoto, this companion novella shows events from his perspective as the resistance ramps up after Juliette’s betrayal.",
  },
];
