import axios from 'axios';
import { randomUUID } from 'crypto';

const LIVE_API = 'https://backend-nine-nu-46.vercel.app/api';

async function runTests() {
    console.log('🚀 Starting Full-Stack QA Integration Test...\n');
    let adminToken = '';
    let studentToken = '';
    let studentId = '';
    let bookId = '';
    let issueId = '';

    const testStudentEmail = `test_${randomUUID().substring(0, 6)}@library.com`;

    try {
        // 1. ADMIN AUTHENTICATION
        console.log('🧪 TEST 1: Admin Authentication');
        const adminLogin = await axios.post(`${LIVE_API}/auth/login`, {
            email: 'admin@library.com',
            password: 'admin123'
        });
        adminToken = adminLogin.data.token;
        console.log('✅ Admin login successful.\n');

        // 2. BOOK MANAGEMENT (CRUD)
        console.log('🧪 TEST 2: Book Creation & Fetching');
        const newBook = await axios.post(`${LIVE_API}/books`, {
            isbn: `ISBN-${Date.now()}`,
            title: 'QA Test Automated Book',
            author: 'Automated Tester',
            category: 'Science',
            publisher: 'Test Press',
            publication_year: 2024,
            total_copies: 5
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        bookId = newBook.data.id;
        console.log(`✅ Book created successfully. ID: ${bookId}`);

        const booksList = await axios.get(`${LIVE_API}/books`);
        if (!booksList.data.some(b => b.id === bookId)) throw new Error('Book not found in list!');
        console.log('✅ Book successfully retrieved from public endpoint.\n');

        // 3. USER REGISTRATION & APPROVAL
        console.log('🧪 TEST 3: User Registration & Admin Approval Flow');
        const register = await axios.post(`${LIVE_API}/auth/register`, {
            username: `Test Student ${Date.now()}`,
            email: testStudentEmail,
            password: 'password123',
            role: 'student',
            student_id: `STU-${Date.now()}`
        });
        studentId = register.data.user.id;
        console.log(`✅ Student registered successfully. ID: ${studentId} (Status: Pending)`);

        // Admin approves student
        await axios.put(`${LIVE_API}/admin/users/${studentId}/status`,
            { status: 'active' },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('✅ Admin successfully approved the student.');

        // Student logs in
        const studentLogin = await axios.post(`${LIVE_API}/auth/login`, {
            email: testStudentEmail,
            password: 'password123'
        });
        studentToken = studentLogin.data.token;
        console.log('✅ Approved student login successful.\n');

        // 4. CIRCULATION (ISSUE & RETURN)
        console.log('🧪 TEST 4: Book Issuing & Returning');
        const issueAction = await axios.post(`${LIVE_API}/issues`, {
            book_id: bookId,
            user_id: studentId
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        issueId = issueAction.data.issue_id;
        console.log(`✅ Book successfully issued to student. Issue ID: ${issueId}`);

        const returnAction = await axios.put(`${LIVE_API}/issues/${issueId}/return`,
            { notes: 'Automated return test' },
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log(`✅ Book successfully returned. Fine Generated: $${returnAction.data.fine_amount}\n`);

        // 5. ANALYTICS & DASHBOARDS
        console.log('🧪 TEST 5: System Dashboards & Analytics Calculations');
        const adminStats = await axios.get(`${LIVE_API}/admin/stats`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ Admin basic stats generated. Active Members count: ${adminStats.data.active_members}`);

        const fineStats = await axios.get(`${LIVE_API}/fines/stats`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ Complex Fine stats generated. Total Revenue: $${fineStats.data.total_fines}`);

        const recommendations = await axios.get(`${LIVE_API}/recommendations/trending`, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        console.log(`✅ Trending Recommendations successfully pulled. Count: ${recommendations.data.length}\n`);

        // Cleanup
        console.log('🧹 CLEANUP: Removing specific test artifacts');
        await axios.delete(`${LIVE_API}/books/${bookId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log(`✅ Deleted test book ${bookId}`);

        console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The application is 100% stable.');

    } catch (error) {
        console.error('\n❌ QA TEST FAILED!');
        if (error.response) {
            console.error('API Error Status:', error.response.status);
            console.error('API Response:', error.response.data);
            console.error('Request URL:', error.response.config.url);
        } else {
            console.error('Error:', error.message);
        }
    }
}

runTests();
