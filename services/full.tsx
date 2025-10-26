import atomic from "../assets/pdf/atomic-habits.pdf";

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
      "Atomic Habits provides practical strategies to form good habits, break bad ones, and master the small behaviors that lead to remarkable results."
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
      "Robert Greene explores the underlying motivations driving human behavior, offering deep insights into understanding people and mastering social intelligence."
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
      "The first book in the Harry Potter series follows a young boy who discovers he’s a wizard and begins his journey at Hogwarts School of Witchcraft and Wizardry."
  },
  {
    id: 4,
    title: "That Will Never Work: The Birth of Netflix and the Amazing Life of an Idea",
    image: require("../assets/images/that will never work (Cover_page).jpg"),
    author: "Marc Randolph",
    year: "2019",
    star: "4",
    link: "https://drive.google.com/uc?export=download&id=1_XknvGdiAKJX_g6YmA1eRBy-EBVeCbrf",
    description:
      "Netflix co-founder Marc Randolph shares the inspiring story of how the world’s top streaming service began, offering lessons in creativity, resilience, and innovation."
  },
  {
    id: 5,
    title: "Everything Is F*cked: A Book About Hope",
    image: require("../assets/images/everything.jpg"),
    author: "Mark Manson",
    year: "2019",
    star: "4",
    link: "https://example.com/book-link",
    description:
      "In this thought-provoking follow-up to 'The Subtle Art of Not Giving a F*ck', Mark Manson examines hope, meaning, and the challenges of modern life."
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
      "Adam Grant explores how success depends on how we interact with others — showing that generous people often achieve the greatest long-term success."
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
      "A heartfelt romance novel that explores love, destiny, and second chances, reminding readers that true love always finds its way back."
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
      "A captivating story of love, loss, and self-discovery, ‘Beyond This Heaven’ takes readers on an emotional journey of healing and inner strength."
  },
];
