import MainLayout from '../components/layouts/MainLayout';
import MainRoadmaps from '../components/MainRoadmaps';
import Hero from '../components/Hero';
import StudyModes from '../components/StudyModes';
import ProjectInfo from '../components/ProjectInfo';
import HomeQuestions from '../components/HomeQuestions';

export default function HomePage() {
  return (
    <MainLayout>
      <div className="home">
        <Hero />
        <MainRoadmaps />
        <StudyModes />
        <ProjectInfo />
        <HomeQuestions />
      </div>
    </MainLayout>
  );
}
