import axios from 'axios';

const LIVE_API = 'https://backend-nine-nu-46.vercel.app/api';

async function testLogin() {
    console.log(`Testing Login to ${LIVE_API}...`);
    try {
        const start = Date.now();
        const response = await axios.post(`${LIVE_API}/auth/login`, {
            email: 'admin@library.com',
            password: 'admin123'
        });

        console.log(`✅ Success! [${Date.now() - start}ms]`);
        console.log('Status code:', response.status);
        console.log('User Role:', response.data?.user?.role);
        console.log('Token Received:', !!response.data?.token);

    } catch (error) {
        if (error.response) {
            console.error('❌ Failed Output Status:', error.response.status);
            console.error('❌ Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Network Error:', error.message);
        }
    }
}

testLogin();
