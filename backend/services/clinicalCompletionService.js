import patientDao from '../dao/patientDao.js';
import userDao from '../dao/userDao.js';
import notificationService from './notificationService.js';

const getId = (value) => value?._id?.toString() || value?.id || value?.toString();

const notifyClinicalCompletion = async ({ request, title, message, type }) => {
    const patientId = getId(request.patient);
    const doctorId = getId(request.doctor);
    const [patient, receptionists] = await Promise.all([
        patientDao.getPatientByMongoId(patientId),
        userDao.getUsers({ role: 'receptionist', isActive: true }),
    ]);

    const recipients = [
        doctorId,
        patient?.userAccount?._id?.toString(),
        ...receptionists.map((user) => user._id.toString()),
    ].filter(Boolean);

    await Promise.all([...new Set(recipients)].map((recipient) => notificationService.createNotification({
        recipient,
        title,
        message,
        type,
        relatedPatient: patientId,
        sendSms: false,
    }, {})));
};

export default { notifyClinicalCompletion };
