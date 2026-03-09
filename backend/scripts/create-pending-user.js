import axios from 'axios';
import { randomUUID } from 'crypto';

async function createPendingUser() {
    try {
        const baseURL = 'https://backend-nine-nu-46.vercel.app';

        console.log('Creating a pending user for approval testing...');
        const uniqueId = randomUUID().substring(0, 8);
        const registerRes = await axios.post(`${baseURL}/api/auth/register`, {
            username: `pending_${uniqueId}`,
            email: `pending_${uniqueId}@library.com`,
            password: 'password123',
            role: 'student',
            student_id: `STU-${uniqueId}`
        });

        console.log(`✅ Success: Pending user created! ID: ${registerRes.data.user.id}`);

    } catch (e) {
        console.error('Test script error:', e.message);
        if (e.response) console.error(e.response.data);
    }
}
createPendingUser();
