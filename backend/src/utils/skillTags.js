// premade Skill Exchange tags (GET /skill-exchange/tags), shared by requests and offers
// posters can also type their own; a typed tag that matches one of these (any case)
// is saved with the casing below so "python" and "Python" show up the same

const SKILL_TAG_GROUPS = [
  {
    name: 'Computer Science & Programming',
    tags: [
      'Programming', 'Computer Science', 'Software Engineering', 'Python', 'Java', 'JavaScript',
      'TypeScript', 'C', 'C++', 'C#', 'Swift', 'Kotlin', 'Go', 'Rust', 'SQL', 'HTML & CSS', 'React',
      'React Native', 'Node.js', 'Web Development', 'Mobile Development', 'Data Structures', 'Algorithms',
      'Object-Oriented Programming', 'Databases', 'Operating Systems', 'Computer Networks', 'Cybersecurity',
      'Machine Learning', 'Artificial Intelligence', 'Data Science', 'Git & GitHub', 'Linux',
      'Cloud Computing', 'Game Development', 'UI/UX Design', 'Technical Interviews', 'Debugging',
    ],
  },
  {
    name: 'Engineering',
    tags: [
      'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Computer Engineering',
      'Bioengineering', 'Energy Engineering', 'Circuits', 'Digital Logic', 'Embedded Systems',
      'Signals & Systems', 'Statics', 'Dynamics', 'Thermodynamics', 'Fluid Mechanics',
      'Materials Science', 'CAD', 'AutoCAD', 'SolidWorks', 'MATLAB', 'Robotics', '3D Printing', 'Arduino',
    ],
  },
  {
    name: 'Mathematics & Statistics',
    tags: [
      'Math', 'Algebra', 'Precalculus', 'Trigonometry', 'Calculus I', 'Calculus II', 'Calculus III',
      'Linear Algebra', 'Differential Equations', 'Discrete Math', 'Probability', 'Statistics',
      'Biostatistics', 'Geometry', 'Number Theory', 'Proofs', 'Excel',
    ],
  },
  {
    name: 'Natural Sciences',
    tags: [
      'Biology', 'General Chemistry', 'Organic Chemistry', 'Biochemistry', 'Physics I', 'Physics II',
      'Anatomy & Physiology', 'Microbiology', 'Genetics', 'Cell Biology', 'Neuroscience', 'Ecology',
      'Environmental Science', 'Astronomy', 'Lab Skills',
    ],
  },
  {
    name: 'Health & Medicine',
    tags: [
      'Pre-Med', 'Nursing', 'Osteopathic Medicine', 'Physical Therapy', 'Occupational Therapy',
      'Physician Assistant', 'Nutrition', 'Pharmacology', 'Medical Terminology', 'Public Health', 'CPR & First Aid',
    ],
  },
  {
    name: 'Business & Economics',
    tags: [
      'Business', 'Accounting', 'Finance', 'Economics', 'Microeconomics', 'Macroeconomics', 'Marketing',
      'Management', 'Entrepreneurship', 'Business Analytics', 'Hospitality Management', 'Investing',
      'Personal Finance', 'Supply Chain',
    ],
  },
  {
    name: 'Architecture, Arts & Design',
    tags: [
      'Architecture', 'Interior Design', 'Graphic Design', 'Digital Art', 'Drawing', 'Painting',
      'Photography', 'Video Editing', 'Animation', 'Adobe Photoshop', 'Adobe Illustrator', 'Figma',
      'Blender', 'Music', 'Music Production', 'Guitar', 'Piano', 'Singing', 'Dance', 'Theater',
    ],
  },
  {
    name: 'Humanities & Social Sciences',
    tags: [
      'English', 'Writing', 'Essay Writing', 'Creative Writing', 'Literature', 'History', 'Philosophy',
      'Ethics', 'Psychology', 'Sociology', 'Political Science', 'Criminal Justice', 'Communications',
      'Journalism', 'Behavioral Science', 'Education',
    ],
  },
  {
    name: 'Languages',
    tags: [
      'Spanish', 'French', 'Italian', 'German', 'Portuguese', 'Mandarin', 'Cantonese', 'Japanese', 'Korean',
      'Arabic', 'Hindi', 'Urdu', 'Bengali', 'Russian', 'Tagalog', 'American Sign Language', 'ESL',
    ],
  },
  {
    name: 'Study & Test Prep',
    tags: [
      'Tutoring', 'Homework Help', 'Exam Prep', 'Study Group', 'Study Skills', 'Note-Taking',
      'Time Management', 'Research', 'Citations', 'Lab Reports', 'MCAT', 'GRE', 'GMAT', 'LSAT', 'NCLEX',
      'DAT', 'Proofreading',
    ],
  },
  {
    name: 'Career & Professional',
    tags: [
      'Resume Review', 'Cover Letters', 'Interview Prep', 'Internships', 'LinkedIn', 'Networking',
      'Public Speaking', 'Presentations', 'Leadership', 'Project Management', 'Microsoft Office',
      'Google Workspace', 'Portfolio Review',
    ],
  },
  {
    name: 'Campus Life',
    tags: [
      'Club Attendance', 'Club Events', 'Event Planning', 'Volunteering', 'Mentorship', 'Peer Support',
      'Fitness', 'Sports', 'Esports', 'Chess', 'Cooking', 'Campus Tours', 'Moving Help', 'Carpool',
    ],
  },
];

// lower-case tag -> its premade spelling
const PREMADE_BY_KEY = new Map(
  SKILL_TAG_GROUPS.flatMap((group) => group.tags.map((tag) => [tag.toLowerCase(), tag]))
);

module.exports = { SKILL_TAG_GROUPS, PREMADE_BY_KEY };
