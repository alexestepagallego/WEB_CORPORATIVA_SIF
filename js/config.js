const MOCK_DATA = {
    students: [
        { id: 's1', name: 'Ana García', email: 'ana@example.com', status: 'unassigned', assignedTutorId: null, studyType: 'Desarrollo Web' },
        { id: 's2', name: 'Carlos López', email: 'carlos@example.com', status: 'assigned', assignedTutorId: 't1', studyType: 'Desarrollo Web' },
        { id: 's3', name: 'María Rodriguez', email: 'maria@example.com', status: 'unassigned', assignedTutorId: null, studyType: 'IA' },
        { id: 's4', name: 'Juan Martínez', email: 'juan@example.com', status: 'unassigned', assignedTutorId: null, studyType: 'Ciberseguridad' },
        { id: 's5', name: 'Lucía Fernández', email: 'lucia@example.com', status: 'assigned', assignedTutorId: 't2', studyType: 'Ciberseguridad' },
        { id: 's6', name: 'Pedro Sánchez', email: 'pedro@example.com', status: 'unassigned', assignedTutorId: null, studyType: 'Desarrollo Web' },
        { id: 's7', name: 'Sofía Díaz', email: 'sofia@example.com', status: 'unassigned', assignedTutorId: null, studyType: 'IA' },
        { id: 's8', name: 'Miguel Torres', email: 'miguel@example.com', status: 'assigned', assignedTutorId: 't1', studyType: 'Desarrollo Web' },
        { id: 's9', name: 'Elena Ruiz', email: 'elena@example.com', status: 'unassigned', assignedTutorId: null, studyType: 'Ciberseguridad' },
        { id: 's10', name: 'David Vasquez', email: 'david@example.com', status: 'unassigned', assignedTutorId: null, studyType: 'IA' },
        { id: 's11', name: 'Laura P.', email: 'laura@example.com', status: 'unassigned', assignedTutorId: null, studyType: 'Desarrollo Web' },
        { id: 's12', name: 'Jorge H.', email: 'jorge@example.com', status: 'unassigned', assignedTutorId: null, studyType: 'Ciberseguridad' }
    ],
    tutors: [
        { id: 't1', name: 'Dr. Roberto Gómez', specialty: 'Desarrollo Web', maxQuota: 5 },
        { id: 't2', name: 'Dra. Laura Jiménez', specialty: 'Ciberseguridad', maxQuota: 5 },
        { id: 't3', name: 'Dr. Alan Turing', specialty: 'IA', maxQuota: 5 }
    ],
    chats: {
        's2_t1': [
            { sender: 'tutor', text: 'Hola Carlos, ¿cómo vas con la tarea?', timestamp: new Date(Date.now() - 86400000).toISOString() },
            { sender: 'student', text: 'Bien Dr., tengo una duda con el ejercicio 3.', timestamp: new Date(Date.now() - 86000000).toISOString() }
        ]
    },
    meetings: [
        { id: 'm1', studentId: 's2', tutorId: 't1', date: '2023-10-15', topic: 'Revisión Parcial' },
        { id: 'm2', studentId: 's5', tutorId: 't2', date: '2023-10-18', topic: 'Entrega Final' }
    ]
};
