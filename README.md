# Tokushima University Course Roadmap Tool

An AI-powered course roadmap generator for Electrical and Electronic System Course students at Tokushima University. This application uses Google's Gemini API to create personalized learning paths based on career goals and syllabus data.

## Features

- **AI-Powered Roadmap Generation**: Uses Gemini API to analyze syllabus data and create personalized course roadmaps
- **Dynamic Career Relevance**: Automatically evaluates subject relevance to different engineering occupations
- **Interactive Flowchart**: Visual representation of course progression with clickable nodes
- **Progress Tracking**: Track completion status and credit accumulation
- **Multiple Career Paths**: Support for various engineering occupations including:
  - Electrical Engineer
  - Communication Engineer
  - Aerospace Engineer
  - Power Engineer
  - Electronics Engineer
  - Software Engineer
  - Control Engineer
  - Robotics Engineer

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API key

## Setup Instructions

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up your Gemini API key**:
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a `.env` file in the root directory
   - Add your API key:
     ```
     REACT_APP_GEMINI_API_KEY=your_api_key_here
     ```

4. **Start the development server**:
   ```bash
   npm start
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

## Project Structure

```
src/
├── services/
│   ├── geminiService.ts    # Gemini API integration
│   └── dataService.ts      # Syllabus data management
├── tokushima-roadmap-tool.tsx  # Main React component
├── index.tsx              # App entry point
└── index.css              # Tailwind CSS styles

public/
├── index.html             # HTML template

syllabus.json              # Course syllabus data
```

## How It Works

1. **Data Loading**: The application loads course data from `syllabus.json`
2. **Career Relevance Analysis**: Gemini API analyzes each subject's relevance to different occupations
3. **Roadmap Generation**: When a user selects an occupation, the AI:
   - Selects the most relevant subjects
   - Organizes them in logical learning sequence
   - Respects prerequisites and academic progression
   - Provides reasoning for subject selection
4. **Visual Display**: Roadmaps are displayed as interactive flowcharts with:
   - Subject nodes with credit information
   - Relevance scores
   - Completion tracking
   - Progress visualization

## API Integration

The application uses Google's Gemini API for:
- **Roadmap Generation**: Creating personalized course paths
- **Career Relevance Scoring**: Evaluating subject relevance to occupations
- **Reasoning**: Providing explanations for subject selection

## Customization

### Adding New Occupations
1. Update the `occupationIcons` object in `tokushima-roadmap-tool.tsx`
2. Add the occupation to the career relevance prompt in `geminiService.ts`

### Modifying Syllabus Data
1. Update `syllabus.json` with new subjects
2. Ensure each subject has the required fields:
   - `id`, `code`, `name`, `credits`, `year`, `semester`
   - `syllabus`, `description`, `keywords`, `learning_outcomes`
   - `career_relevance` scores

## Environment Variables

- `REACT_APP_GEMINI_API_KEY`: Your Google Gemini API key (required)

## Troubleshooting

### API Key Issues
- Ensure your API key is correctly set in the `.env` file
- Verify the API key has the necessary permissions
- Check that the environment variable name starts with `REACT_APP_`

### Data Loading Issues
- Verify `syllabus.json` is in the root directory
- Check that the JSON structure matches the expected format
- Ensure all required fields are present

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript configuration in `tsconfig.json`
- Verify all dependencies are properly installed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes at Tokushima University.

## Support

For issues or questions, please contact the development team or create an issue in the repository. 