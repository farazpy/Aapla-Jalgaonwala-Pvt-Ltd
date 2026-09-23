import { GalleryItem, VideoItem } from '@/types';

export const initialGalleryItems: GalleryItem[] = [
  {
    id: 'f1',
    title: 'Founders Saurabh & Jayesh at Jalgaon Farm',
    category: 'founders',
    categoryLabel: 'Founders & Leadership',
    imgUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1000&q=80',
    caption: 'Co-founders Saurabh Patil and Jayesh Patil inspecting raw green Grand Naine banana bunches in Shendurni orchard, Jalgaon.',
    date: 'August 2024',
    location: 'Shendurni, Jalgaon'
  },
  {
    id: 'f2',
    title: 'Co-Founder Saurabh Patil with Local Farmers',
    category: 'founders',
    categoryLabel: 'Founders & Leadership',
    imgUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1000&q=80',
    caption: 'Saurabh finalizing farmgate purchase agreements with local banana growers in Jalgaon district.',
    date: 'June 2024',
    location: 'Jalgaon Orchards'
  },
  {
    id: 'f3',
    title: 'Jayesh Patil Testing Spice Formulations',
    category: 'founders',
    categoryLabel: 'Founders & Leadership',
    imgUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1000&q=80',
    caption: 'Jayesh supervising the master blending of traditional Khandeshi Kala Masala in small culinary batches.',
    date: 'October 2024',
    location: 'Central Kitchen, Pune'
  },
  {
    id: 'g1',
    title: 'Harvesting Raw Bananas at Dawn',
    category: 'farmgate',
    categoryLabel: 'Farmgate & Sourcing',
    imgUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1000&q=80',
    caption: 'Freshly harvested firm green bananas selected specifically for low moisture and ideal starch density.',
    date: 'Daily Morning',
    location: 'Jalgaon'
  },
  {
    id: 'g2',
    title: 'Quality Inspection & Sorting',
    category: 'farmgate',
    categoryLabel: 'Farmgate & Sourcing',
    imgUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=1000&q=80',
    caption: 'Hand-sorting bunches to remove imperfections before transport to processing facility.',
    date: 'Daily Harvest',
    location: 'Jalgaon Direct Hub'
  },
  {
    id: 'p1',
    title: 'Artisanal Small-Batch Frying Kettles',
    category: 'factory',
    categoryLabel: 'Production & Quality',
    imgUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1000&q=80',
    caption: 'Clean, temperature-controlled frying in high-grade vegetable oil to achieve golden crispness.',
    date: 'Batch Operations',
    location: 'Processing Unit'
  },
  {
    id: 'p2',
    title: 'Precision Ultra-Thin Slicing Line',
    category: 'factory',
    categoryLabel: 'Production & Quality',
    imgUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=1000&q=80',
    caption: 'Automated ultra-thin slicing ensures even thickness and satisfying snap in every single chip.',
    date: 'Quality Control',
    location: 'Processing Unit'
  },
  {
    id: 'pr1',
    title: 'Felicitation at Agri-Food Conclave',
    category: 'press',
    categoryLabel: 'Media & Press',
    imgUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80',
    caption: 'Aapla Jalgaonwala awarded Best Regional Agro-Retail Brand at the Maharashtra Food Leadership Summit.',
    date: 'November 2024',
    location: 'Mumbai'
  },
  {
    id: 'pr2',
    title: 'Featured in Regional Business Daily',
    category: 'press',
    categoryLabel: 'Media & Press',
    imgUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80',
    caption: 'Special coverage on how Jalgaon’s banana farmers are earning higher returns through direct brand partnerships.',
    date: 'January 2025',
    location: 'Pune Press Release'
  }
];

export const initialVideoItems: VideoItem[] = [
  {
    id: 'v1',
    title: 'The Journey from Jalgaon Farms to Your Snack Bowl',
    duration: '03:45',
    thumbnail: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1000&q=80',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
    description: 'Watch co-founders Saurabh and Jayesh take you through the banana orchards of Jalgaon and demonstrate the small-batch frying process.',
    category: 'Brand Story',
    speaker: 'Saurabh Patil & Jayesh Patil'
  },
  {
    id: 'v2',
    title: 'How We Formulate Authentic Khandeshi Kala Masala',
    duration: '02:15',
    thumbnail: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1000&q=80',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
    description: 'Jayesh Patil demonstrates the slow roasting of 18 whole spices in iron kadhais to create our signature masala dusting.',
    category: 'Behind the Scenes',
    speaker: 'Jayesh Patil (Co-Founder)'
  },
  {
    id: 'v3',
    title: 'Flagship Store Launch in Dehu, Pune',
    duration: '01:50',
    thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
    description: 'Highlights from our inauguration day featuring live chip frying, customer reactions, and tasting sessions.',
    category: 'Event Highlight',
    speaker: 'Aapla Jalgaonwala Team'
  }
];

