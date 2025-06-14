import React, { useState, useMemo, useEffect } from 'react';
// Add ChevronLeft and ChevronRight to your lucide-react import
import { Calendar, Clock, Users, Video, Plus, MoreVertical, Play, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

import api from '../utils/api'; // Adjust the import path as necessary
import { useParams, useNavigate } from 'react-router-dom';

const PsychologistOverview = ({ profile }) => {



    const navigate = useNavigate();
    const handleViewProfile = (studentId) => {
        navigate('/psychologist/viewstudent/' + studentId);
    };



    // Sample data - replace with your actual data
    const PsychologistEmail = profile.contactInfo?.email;
    //console.log('Psychologist Email:', PsychologistEmail);
    // find the psychologist by calling an api
    const [psychologist, setPsychologist] = useState(null);

    const [psychologistIdInPsychologistCollection, setPsychologistIdInPsychologistCollection] = useState(null);
    const [psychologistId, setPsychologistId] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');




    useEffect(() => {
        const fetchPsychologistID = async () => {
            try {
                if (!PsychologistEmail || PsychologistEmail.trim() === '') {
                    console.warn('PsychologistEmail is missing, skipping fetch');
                    return;
                }
                const response = await api.psychologists.getByEmail(PsychologistEmail);
                setPsychologist(response.data);
                setPsychologistIdInPsychologistCollection(response.data._id);
                setPsychologistId(response.data.user);
                //console.log('Fetched Psychologist:', response.data);
            } catch (error) {
                console.error('Error fetching psychologist:', error);
            }
        };

        fetchPsychologistID();
    }, [PsychologistEmail]);







    // const [students] = useState([
    //     { id: 1, name: 'John Doe', email: 'john@example.com', enrollDate: '2024-01-15', status: 'Active' },
    //     { id: 2, name: 'Jane Smith', email: 'jane@example.com', enrollDate: '2024-02-20', status: 'Active' },
    //     { id: 3, name: 'Mike Johnson', email: 'mike@example.com', enrollDate: '2024-03-10', status: 'Inactive' },
    // ]);

    const [students, setStudents] = useState([]);
    useEffect(() => {
        if (!psychologistId) return;
        const fetchStudents = async () => {
            try {
                const response = await api.psychologists.getStudents(psychologistId);
                setStudents(response.data);
                //console.log('Fetched Students:', response.data);
            } catch (error) {
                console.error('Error fetching students:', error);
            }
        };

        fetchStudents();
    }, [psychologistId]);

    const filteredStudents = useMemo(() => {
        // If there's no search query, return the original list
        if (!searchQuery) {
            return students;
        }
        // Otherwise, filter the list
        return students.filter(student =>
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [students, searchQuery]);


    // const [sessions] = useState([
    //     { id: 1, studentId: 1, studentName: 'John Doe', date: '2025-06-12', time: '10:00 AM', duration: 60, type: 'Individual', status: 'Scheduled' },
    //     { id: 2, studentId: 2, studentName: 'Jane Smith', date: '2025-06-12', time: '2:00 PM', duration: 45, type: 'Group', status: 'Scheduled' },
    //     { id: 3, studentId: 1, studentName: 'John Doe', date: '2025-06-15', time: '11:00 AM', duration: 60, type: 'Individual', status: 'Scheduled' },
    //     { id: 4, studentId: 3, studentName: 'Mike Johnson', date: '2025-06-16', time: '3:00 PM', duration: 45, type: 'Individual', status: 'Scheduled' },
    // ]);

    const [sessions, setSessions] = useState([]);


    useEffect(() => {
        if (!psychologistId) return;
        const fetchSessions = async () => {
            try {
                //console.log('Fetching sessions for psychologistId:', psychologistId);
                const response = await api.psychologists.getSessions(psychologistIdInPsychologistCollection);
                setSessions(response.data);
                //console.log('Fetched Sessions:', response.data);
            } catch (error) {
                console.error('Error fetching sessions:', error);
            }
        };

        fetchSessions();
    }, [psychologistId]);



    const [seminars] = useState([
        { id: 1, title: 'Mental Health Awareness', date: '2025-06-20', attendees: 25 },
        { id: 2, title: 'Stress Management', date: '2025-06-25', attendees: 30 },
    ]);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showStudentMenu, setShowStudentMenu] = useState(null);
    const [showNewSessionModal, setShowNewSessionModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Get current month and year
    const currentDate = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    // Generate calendar days
    const generateCalendarDays = () => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            days.push(new Date(date));
        }

        return days;
    };

    const calendarDays = generateCalendarDays();

    const formatDateForComparison = (date) => {
        return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); // 'YYYY-MM-DD'
    };

    // Get sessions for selected date
    const getSessionsForDate = (date) => {
        const dateString = formatDateForComparison(date);
        return sessions.filter(session => session.date === dateString);
    };

    const selectedDateSessions = getSessionsForDate(selectedDate);

    // Get upcoming sessions (next 7 days)
    const upcomingSessions = useMemo(() => {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        return sessions.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= today && sessionDate <= nextWeek;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [sessions]);

    const handleDateClick = (date) => {
        setSelectedDate(date);
    };

    const handleStudentMenuClick = (studentId) => {
        setShowStudentMenu(showStudentMenu === studentId ? null : studentId);
    };

    const handleAddSession = (student) => {
        setSelectedStudent(student);
        setShowNewSessionModal(true);
        setShowStudentMenu(null);
    };

    const handleStartSession = (session) => {
        // Implement session start logic
        console.log('Starting session:', session);
        alert(`Starting session with ${session.studentName}`);
    };

    // ... inside the PsychologistOverview component

    const handlePrevMonth = () => {
        setSelectedDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setSelectedDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };



    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSameMonth = (date) => {
        return date.getMonth() === currentMonth;
    };

    const hasSessionsOnDate = (date) => {
        return getSessionsForDate(date).length > 0;
    };

    return (
        <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* Overview Cards */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' }}>
                    Dashboard Overview
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        padding: '24px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', margin: '0 0 8px 0' }}>Total Students</h3>
                                <p style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', margin: '0' }}>{students?.length || 0}</p>
                            </div>
                            <Users style={{ width: '40px', height: '40px', color: '#3b82f6' }} />
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: '#ffffff',
                        padding: '24px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', margin: '0 0 8px 0' }}>Upcoming Sessions</h3>
                                <p style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', margin: '0' }}>{upcomingSessions?.length || 0}</p>
                            </div>
                            <Clock style={{ width: '40px', height: '40px', color: '#10b981' }} />
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: '#ffffff',
                        padding: '24px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', margin: '0 0 8px 0' }}>Seminars</h3>
                                <p style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', margin: '0' }}>{seminars?.length || 0}</p>
                            </div>
                            <Video style={{ width: '40px', height: '40px', color: '#f59e0b' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                {/* Calendar Section */}
                <div style={{
                    backgroundColor: '#ffffff',
                    padding: '24px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar style={{ width: '24px', height: '24px' }} />
                        Calendar View
                    </h3>

                    {/* Calendar Header */}
                    {/* Calendar Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>

                        {/* START: Previous Month Button */}
                        <button
                            onClick={handlePrevMonth}
                            aria-label="Previous month"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '50%' }}
                        >
                            <ChevronLeft style={{ width: '20px', height: '20px', color: '#475569' }} />
                        </button>
                        {/* END: Previous Month Button */}

                        <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: 0 }}>
                            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h4>

                        {/* START: Next Month Button */}
                        <button
                            onClick={handleNextMonth}
                            aria-label="Next month"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '50%' }}
                        >
                            <ChevronRight style={{ width: '20px', height: '20px', color: '#475569' }} />
                        </button>
                        {/* END: Next Month Button */}

                    </div>

                    {/* Calendar Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '20px' }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} style={{
                                padding: '8px',
                                textAlign: 'center',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#64748b'
                            }}>
                                {day}
                            </div>
                        ))}

                        {calendarDays.map((date, index) => (
                            <div
                                key={index}
                                onClick={() => handleDateClick(date)}
                                style={{
                                    padding: '8px',
                                    textAlign: 'center',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    backgroundColor: selectedDate.toDateString() === date.toDateString() ? '#3b82f6' :
                                        isToday(date) ? '#dbeafe' : 'transparent',
                                    color: selectedDate.toDateString() === date.toDateString() ? '#ffffff' :
                                        isToday(date) ? '#1e40af' :
                                            !isSameMonth(date) ? '#9ca3af' : '#374151',
                                    fontWeight: isToday(date) || selectedDate.toDateString() === date.toDateString() ? '600' : '400',
                                    border: hasSessionsOnDate(date) ? '2px solid #10b981' : '2px solid transparent',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {date.getDate()}
                            </div>
                        ))}
                    </div>

                    {/* Selected Date Sessions */}
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                            Sessions for {formatDate(selectedDate)}
                        </h4>
                        {selectedDateSessions.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedDateSessions.map(session => (
                                    <div key={session.id} style={{
                                        padding: '12px',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <p style={{ margin: '0 0 4px 0', fontWeight: '500', color: '#374151' }}>
                                                {session.studentName}
                                            </p>
                                            <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>
                                                {session.time} • {session.duration} min • {session.type}
                                            </p>
                                        </div>
                                        {/* <button
                                            onClick={() => handleStartSession(session)}
                                            style={{
                                                backgroundColor: '#10b981',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '6px 12px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <Play style={{ width: '12px', height: '12px' }} />
                                            Start
                                        </button> */}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>
                                No sessions scheduled for this day
                            </p>
                        )}
                    </div>
                </div>

                {/* Students Section */}
                <div style={{
                    backgroundColor: '#ffffff',
                    padding: '24px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users style={{ width: '24px', height: '24px' }} />
                        My Students
                    </h3>

                    {/* START: Added Search Input */}
                    <div style={{ marginBottom: '16px' }}>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '14px',
                                boxSizing: 'border-box' // Ensures padding doesn't affect the overall width
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                        {filteredStudents.map(student => (
                            <div key={student.id} style={{
                                padding: '16px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                                        {student.name}
                                    </h4>
                                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#64748b' }}>
                                        {student.email}
                                    </p>
                                    <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>
                                        Enrolled: {new Date(student.enrollDate).toLocaleDateString()}
                                    </p>
                                </div>

                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => handleStudentMenuClick(student.id)}
                                        style={{
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            padding: '8px',
                                            cursor: 'pointer',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <MoreVertical style={{ width: '20px', height: '20px', color: '#64748b' }} />
                                    </button>

                                    {showStudentMenu === student.id && (
                                        <div style={{
                                            position: 'absolute',
                                            right: '0',
                                            top: '100%',
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            zIndex: 10,
                                            minWidth: '160px'
                                        }}>
                                            {/* <button
                                                onClick={() => handleAddSession(student)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    backgroundColor: 'transparent',
                                                    border: 'none',
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    color: '#374151',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                <Plus style={{ width: '16px', height: '16px' }} />
                                                Add Session
                                            </button> */}

                                            <button
                                                onClick={() => handleViewProfile(student.id)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    backgroundColor: 'transparent',
                                                    border: 'none',
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    color: '#374151',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                <Users style={{ width: '16px', height: '16px' }} />
                                                View Profile
                                            </button>
                                            <button
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    backgroundColor: 'transparent',
                                                    border: 'none',
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    color: '#374151',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                <Edit style={{ width: '16px', height: '16px' }} />
                                                Edit Profile
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Upcoming Sessions Section */}
            {/* <div style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
            }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock style={{ width: '24px', height: '24px' }} />
                    Upcoming Sessions (Next 7 Days)
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {upcomingSessions.map(session => (
                        <div key={session.id} style={{
                            padding: '20px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                                        {session.studentName}
                                    </h4>
                                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#64748b' }}>
                                        {new Date(session.date).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric'
                                        })} at {session.time}
                                    </p>
                                    <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>
                                        {session.duration} minutes • {session.type}
                                    </p>
                                </div>
                                <span style={{
                                    backgroundColor: '#dbeafe',
                                    color: '#1e40af',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                }}>
                                    {session.status}
                                </span>
                            </div>

                            <button
                                onClick={() => handleStartSession(session)}
                                style={{
                                    backgroundColor: '#3b82f6',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '10px 16px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                            >
                                <Play style={{ width: '16px', height: '16px' }} />
                                Start Session
                            </button>
                        </div>
                    ))}
                </div>

                {upcomingSessions.length === 0 && (
                    <p style={{ color: '#64748b', fontSize: '16px', textAlign: 'center', fontStyle: 'italic' }}>
                        No upcoming sessions in the next 7 days
                    </p>
                )}
            </div> */}

            {/* New Session Modal */}
            {showNewSessionModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        padding: '32px',
                        borderRadius: '16px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        maxWidth: '400px',
                        width: '90%'
                    }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
                            Add New Session for {selectedStudent?.name}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                                    Date
                                </label>
                                <input
                                    type="date"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                                    Time
                                </label>
                                <input
                                    type="time"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <button
                                onClick={() => setShowNewSessionModal(false)}
                                style={{
                                    backgroundColor: '#e5e7eb',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '10px 16px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                style={{
                                    backgroundColor: '#10b981',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '10px 16px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Add Session
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PsychologistOverview;    