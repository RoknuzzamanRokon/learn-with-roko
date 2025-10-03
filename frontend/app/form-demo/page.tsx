import { FormExample } from "../components/common";

export default function FormDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Form Component Demo
          </h1>
          <p className="text-xl text-gray-600">
            Showcasing the new form styling system with color palette
            integration
          </p>
        </div>

        <FormExample />

        <div className="mt-16 bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Form Styling Features
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Input Elements
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Text inputs with focus states using primary colors</li>
                <li>• Validation state colors (success, warning, error)</li>
                <li>• Consistent select dropdowns with custom styling</li>
                <li>• Custom checkbox and radio button designs</li>
                <li>• Textarea elements with proper sizing</li>
                <li>• Disabled states with appropriate visual feedback</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Validation & Feedback
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Error messages with consistent styling</li>
                <li>• Success confirmation styling</li>
                <li>• Loading states and progress indicators</li>
                <li>• Multi-step form progress visualization</li>
                <li>• Form validation summary components</li>
                <li>• Help text and optional field indicators</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">
              Design System Integration
            </h4>
            <p className="text-blue-700 text-sm">
              All form components use CSS custom properties from the design
              system, ensuring consistent colors across the application and easy
              theme customization. The styling follows WCAG AA accessibility
              guidelines with proper contrast ratios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
