document.addEventListener('DOMContentLoaded', () => {
    const initDbButton = document.getElementById('init-db-button');
    const pbUrlInput = document.getElementById('pb-url');
    const adminEmailInput = document.getElementById('admin-email');
    const adminPasswordInput = document.getElementById('admin-password');
    const logOutput = document.getElementById('log-output');

    initDbButton.addEventListener('click', initializeDatabase);

    /**
     * Logs a message to the on-screen log.
     * @param {string} message The message to log.
     * @param {boolean} isError Whether the message is an error.
     */
    function log(message, isError = false) {
        console.log(message);
        logOutput.textContent += `\n[${new Date().toLocaleTimeString()}] ${message}`;
        if (isError) {
            logOutput.style.color = 'red';
        }
    }

    /**
     * Handles the entire database initialization process.
     */
    async function initializeDatabase() {
        const pbUrl = pbUrlInput.value.trim();
        const adminEmail = adminEmailInput.value.trim();
        const adminPassword = adminPasswordInput.value.trim();

        if (!pbUrl || !adminEmail || !adminPassword) {
            alert('请填写所有字段！');
            return;
        }

        logOutput.textContent = '开始初始化...';
        logOutput.style.color = 'inherit';
        initDbButton.disabled = true;

        try {
            // 1. Connect to PocketBase
            const pb = new PocketBase(pbUrl);
            log('连接到 PocketBase 实例...');

            // 2. Authenticate as admin
            log('正在验证管理员身份...');
            await pb.admins.authWithPassword(adminEmail, adminPassword);
            log('✅ 管理员验证成功！');

            // 3. Create 'labels' collection
            await createLabelsCollection(pb);

            // 4. Create 'records' collection
            await createRecordsCollection(pb);

            log('\n🎉 所有数据表创建成功！初始化完成。');

        } catch (error) {
            log(`\n❌ 操作失败: ${error.message}`, true);
        } finally {
            initDbButton.disabled = false;
        }
    }

    /**
     * Creates the 'labels' collection in PocketBase.
     * @param {PocketBase} pb The PocketBase instance.
     */
    async function createLabelsCollection(pb) {
        log('正在创建 "labels" 数据表...');

        await pb.collections.import([
            {
                name: 'labels',
                schema: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'type', type: 'select', options: { values: ['good', 'bad'] }, required: true },
                    { name: 'money', type: 'number', required: true }
                ],
                listRule: null, // Publicly listable
                viewRule: null, // Publicly viewable
                createRule: '@admin.id != ""', // Only admins can create
                updateRule: '@admin.id != ""', // Only admins can update
                deleteRule: '@admin.id != ""'  // Only admins can delete
            }
        ], false); // false = don't delete missing collections
        log('✅ "labels" 数据表创建成功！');
    }

    /**
     * Creates the 'records' collection in PocketBase.
     * @param {PocketBase} pb The PocketBase instance.
     */
    async function createRecordsCollection(pb) {
        log('正在创建 "records" 数据表...');

        await pb.collections.import([
            {
                name: 'records',
                schema: [
                    { name: 'date', type: 'date', required: true },
                    { name: 'label_name', type: 'text', required: true },
                    { name: 'money_change', type: 'number', required: true }
                ],
                // For a multi-user scenario, you'd restrict these to "@request.auth.id = user.id"
                // For this app, we'll keep them open for simplicity.
                listRule: null,
                viewRule: null,
                createRule: null,
                updateRule: null,
                deleteRule: null
            }
        ], false);
        log('✅ "records" 数据表创建成功！');
    }
});
