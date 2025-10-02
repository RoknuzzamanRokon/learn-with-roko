import { CourseDetail } from "../../components/catalog/CourseDetail";
import { Navigation } from "../../components/common/Navigation";

interface CourseDetailPageProps {
  params: {
    id: string;
  };
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const courseId = parseInt(params.id);

  if (isNaN(courseId)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-700">Invalid course ID</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <CourseDetail courseId={courseId} />
    </div>
  );
}
