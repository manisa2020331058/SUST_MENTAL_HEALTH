import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { User, Mail, Phone, MapPin, GraduationCap, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const StudentProfile = () => {
    const { studentId } = useParams();

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStudentInfo = async () => {
            try {
                const response = await api.psychologists.getStudentInfo(studentId);
                if (!response.data) {
                    throw new Error('No student data found');
                }
                console.log('Fetched student info:', response.data);

                setStudent(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch student info');
                setLoading(false);
            }
        };

        if (studentId) {
            fetchStudentInfo();
        }
    }, [studentId]);

    if (loading) return <p>Loading student info...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;


    return (
        <div className="p-4">
            <h2 className="text-lg font-semibold">Student Profile</h2>
            <div className="mt-4">
                <h3 className="text-md font-medium">Personal Information</h3>
                <p>Name: {student.personalInfo?.name || 'Unknown'}</p>
                <p>Email: {student.contactInfo?.email || 'Unknown'}</p>
                <p>Phone: {student.contactInfo?.phone || 'Unknown'}</p>
                <p>Address: {student.contactInfo?.address || 'Unknown'}</p>
            </div>
            <div className="mt-4">
                <h3 className="text-md font-medium">Academic Information</h3>
                <p>Department: {student.academicInfo?.department || 'Unknown'}</p>
                <p>Registration Number: {student.academicInfo?.registrationNumber || 'Unknown'}</p>
            </div>
        </div>
    );
};

export default StudentProfile;