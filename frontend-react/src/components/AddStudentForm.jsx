import { useState } from 'react';
import api from '../utils/api';

const AddStudentForm = ({ onClose, onSuccess }) => {
  const [activeSection, setActiveSection] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Basic Information
    student_id: '',
    first_name: '',
    last_name: '',
    grade: '',
    section: '',
    gender: '',
    date_of_birth: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    socioeconomic_status: 'Medium',
    parent_education: 'High School',
    
    // Academic Information (REQUIRED)
    current_gpa: '',
    previous_gpa: '',
    failed_subjects: '0',
    assignment_submission_rate: '',
    math_score: '',
    science_score: '',
    english_score: '',
    social_score: '',
    language_score: '',
    semester: 'Semester 1'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateBasicInfo = () => {
    const required = ['student_id', 'first_name', 'last_name', 'grade', 'date_of_birth', 'parent_email'];
    for (let field of required) {
      if (!formData[field]) {
        setError(`${field.replace('_', ' ')} is required`);
        return false;
      }
    }
    if (![6, 7, 8, 9, 10].includes(parseInt(formData.grade))) {
      setError('Grade must be between 6 and 10');
      return false;
    }
    return true;
  };

  const validateAcademicInfo = () => {
    const required = ['current_gpa', 'assignment_submission_rate', 'math_score', 'science_score', 'english_score', 'social_score', 'language_score'];
    for (let field of required) {
      if (!formData[field]) {
        setError(`${field.replace('_', ' ')} is required for accurate risk prediction`);
        return false;
      }
    }
    
    // Validate ranges
    if (parseFloat(formData.current_gpa) < 0 || parseFloat(formData.current_gpa) > 10) {
      setError('GPA must be between 0 and 10');
      return false;
    }
    if (formData.previous_gpa && (parseFloat(formData.previous_gpa) < 0 || parseFloat(formData.previous_gpa) > 10)) {
      setError('Previous GPA must be between 0 and 10');
      return false;
    }
    if (parseFloat(formData.assignment_submission_rate) < 0 || parseFloat(formData.assignment_submission_rate) > 100) {
      setError('Assignment submission rate must be between 0 and 100');
      return false;
    }
    
    const scores = ['math_score', 'science_score', 'english_score', 'social_score', 'language_score'];
    for (let score of scores) {
      if (parseFloat(formData[score]) < 0 || parseFloat(formData[score]) > 100) {
        setError(`${score.replace('_', ' ')} must be between 0 and 100`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateBasicInfo()) return;
    if (!validateAcademicInfo()) return;

    setLoading(true);
    try {
      // Create student
      const studentData = {
        student_id: formData.student_id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        grade: parseInt(formData.grade),
        section: formData.section || null,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth,
        parent_name: formData.parent_name || null,
        parent_phone: formData.parent_phone || null,
        parent_email: formData.parent_email,
        socioeconomic_status: formData.socioeconomic_status,
        parent_education: formData.parent_education
      };

      const studentResponse = await api.post('/students', studentData);
      const createdStudent = studentResponse.data;

      // Create academic record
      const academicData = {
        student_id: createdStudent.id,
        semester: formData.semester,
        current_gpa: parseFloat(formData.current_gpa),
        previous_gpa: formData.previous_gpa ? parseFloat(formData.previous_gpa) : null,
        grade_trend: formData.previous_gpa ? parseFloat(formData.current_gpa) - parseFloat(formData.previous_gpa) : 0,
        failed_subjects: parseInt(formData.failed_subjects),
        assignment_submission_rate: parseFloat(formData.assignment_submission_rate),
        math_score: parseFloat(formData.math_score),
        science_score: parseFloat(formData.science_score),
        english_score: parseFloat(formData.english_score),
        social_score: parseFloat(formData.social_score),
        language_score: parseFloat(formData.language_score)
      };

      await api.post('/academics', academicData);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'basic', label: '📋 Basic Info', icon: '📋' },
    { id: 'academic', label: '📚 Academic Info', icon: '📚' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold">➕ Add New Student</h2>
        <p className="text-blue-100 mt-2">Complete all sections for accurate risk prediction</p>
      </div>

      {/* Section Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeSection === section.id
                  ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-300 text-red-800 rounded-lg">
              ⚠️ {error}
            </div>
          )}

          {/* Basic Information Section */}
          {activeSection === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleChange}
                    placeholder="e.g., STU2024001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grade <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="">Select Grade</option>
                    {[6, 7, 8, 9, 10].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
                  <input
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    placeholder="e.g., A, B, C"
                    maxLength="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Parent Name</label>
                  <input
                    type="text"
                    name="parent_name"
                    value={formData.parent_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Parent Phone</label>
                  <input
                    type="tel"
                    name="parent_phone"
                    value={formData.parent_phone}
                    onChange={handleChange}
                    placeholder="+1234567890"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Parent Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="parent_email"
                    value={formData.parent_email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Socioeconomic Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="socioeconomic_status"
                    value={formData.socioeconomic_status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Parent Education <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="parent_education"
                    value={formData.parent_education}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="Elementary">Elementary</option>
                    <option value="High School">High School</option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Master">Master</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (validateBasicInfo()) {
                      setActiveSection('academic');
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Next: Academic Info →
                </button>
              </div>
            </div>
          )}

          {/* Academic Information Section */}
          {activeSection === 'academic' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 font-semibold">⚠️ Academic data is required for accurate risk prediction</p>
                <p className="text-yellow-700 text-sm mt-1">All fields marked with * must be filled to enable ML-based dropout risk assessment</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                >
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current GPA (0-10) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="current_gpa"
                    value={formData.current_gpa}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g., 7.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Previous GPA (0-10)
                  </label>
                  <input
                    type="number"
                    name="previous_gpa"
                    value={formData.previous_gpa}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="Leave empty if first semester"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Failed Subjects <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="failed_subjects"
                    value={formData.failed_subjects}
                    onChange={handleChange}
                    min="0"
                    max="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assignment Submission Rate (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="assignment_submission_rate"
                    value={formData.assignment_submission_rate}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="e.g., 85.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">Subject Scores (0-100)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Math Score <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="math_score"
                      value={formData.math_score}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Science Score <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="science_score"
                      value={formData.science_score}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      English Score <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="english_score"
                      value={formData.english_score}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Social Studies Score <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="social_score"
                      value={formData.social_score}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Language Score <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="language_score"
                      value={formData.language_score}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setActiveSection('basic')}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  ← Back to Basic Info
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Student...' : '✓ Create Student'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddStudentForm;
