import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { userService } from '../utils/userService.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

const DoctorSchedule = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [doctor, setDoctor] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const timeSlots = ['Off', '9:00 AM - 5:00 PM', '8:00 AM - 4:00 PM', '10:00 AM - 6:00 PM'];

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        setIsLoading(true);
        const response = await userService.getUserById(id);
        const userData = response.data;
        setDoctor(userData);
        setSchedule(userData.schedule || {});
      } catch (error) {
        toast.error('Failed to load doctor data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctorData();
  }, [id]);

  const handleScheduleChange = (day, value) => {
    setSchedule(prev => ({ ...prev, [day]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await userService.updateUser(id, { schedule });
      toast.success("Doctor's schedule updated successfully!");
      navigate('/doctors');
    } catch (error) {
      toast.error('Failed to update schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Manage Schedule</h1>
            <p className="text-lg text-gray-600">Dr. {doctor?.firstName} {doctor?.lastName}</p>
        </div>
        <button onClick={() => navigate('/doctors')} className="btn-secondary flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Doctors
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {days.map(day => (
            <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium text-gray-700 capitalize">{day}</label>
              <select
                value={schedule[day] || 'Off'}
                onChange={(e) => handleScheduleChange(day, e.target.value)}
                className="input-field w-48"
              >
                {timeSlots.map(slot => (<option key={slot} value={slot}>{slot}</option>))}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center disabled:opacity-50">
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isSubmitting ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorSchedule;