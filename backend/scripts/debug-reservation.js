import axios from 'axios';
import { randomUUID } from 'crypto';

const LIVE_API = 'https://backend-nine-nu-46.vercel.app/api';

async function testApprove() {
    try {
        const adminLogin = await axios.post(`${LIVE_API}/auth/login`, {
            email: 'admin@library.com',
            password: 'admin123'
        });
        const adminToken = adminLogin.data.token;

        // Get reservations
        const reservations = await axios.get(`${LIVE_API}/reservations`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        console.log('Got', reservations.data.length, 'reservations to test.');

        if (reservations.data.length > 0) {
            const pendingRes = reservations.data.find(r => r.status === 'pending');
            if (pendingRes) {
                console.log(`Testing approval for reservation ID: ${pendingRes.id}`);
                // Attempt approval
                const response = await axios.patch(`${LIVE_API}/reservations/${pendingRes.id}/approve`, {}, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                console.log('✅ Approved successfully!', response.data);
            } else {
                console.log('No pending reservations found to test.');
            }
        }
    } catch (error) {
        if (error.response) {
            console.error('❌ API Error Status:', error.response.status);
            console.error('❌ API Response Payload:', error.response.data);
        } else {
            console.error('❌ General Error:', error.message);
        }
    }
}
testApprove();
