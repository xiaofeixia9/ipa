const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const bplistParser = require('bplist-parser');

// IPA 文件路径
const IPA_PATH = path.join(__dirname, 'ipa', 'HuaFuSC.ipa');
const OUTPUT_PATH = path.join(__dirname, 'index.html');

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function getFileDate(filePath) {
    const stats = fs.statSync(filePath);
    const date = new Date(stats.mtime);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function generateHTML(appInfo) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appInfo.name || 'HuaFuSC'} - IPA 信息</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #e5e5e5;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .card {
            background: #ffffff;
            border-radius: 30px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            padding: 40px;
            max-width: 500px;
            width: 100%;
        }

        .app-icon {
            width: 100px;
            height: 100px;
            border-radius: 22px;
            margin: 0 auto 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .app-icon img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .app-name {
            text-align: center;
            font-size: 28px;
            font-weight: 700;
            color: #1a1a2e;
            margin-bottom: 8px;
        }

        .bundle-id {
            text-align: center;
            font-size: 12px;
            color: #888;
            margin-bottom: 32px;
            font-family: monospace;
        }

        .info-container {
            display: flex;
            gap: 16px;
        }

        .info-column {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .info-box {
            background: #f5f5f5;
            border-radius: 20px;
            padding: 16px 20px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .info-label {
            font-size: 12px;
            color: #999;
            font-weight: 500;
        }

        .info-value {
            font-size: 18px;
            font-weight: 600;
            color: #1a1a2e;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .install-btn {
            display: block;
            width: 100%;
            padding: 16px;
            margin-top: 24px;
            background: #007AFF;
            color: #ffffff;
            border: none;
            border-radius: 14px;
            font-size: 17px;
            font-weight: 600;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            transition: background 0.2s;
        }

        .install-btn:active {
            background: #0056b3;
        }

        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #aaa;
        }

        @media (max-width: 480px) {
            .card {
                padding: 30px 24px;
                border-radius: 24px;
            }

            .app-icon {
                width: 80px;
                height: 80px;
            }

            .app-name {
                font-size: 24px;
            }

            .info-container {
                gap: 12px;
            }

            .info-box {
                padding: 14px 16px;
            }

            .info-value {
                font-size: 14px;
            }

            .install-btn {
                padding: 14px;
                font-size: 16px;
            }
        }

        @media (max-width: 380px) {
            .info-value {
                font-size: 12px;
            }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="app-icon">
            <img src="ipa/AppsStore.png" alt="${appInfo.name || 'App'}" width="100" height="100">
        </div>
        <h1 class="app-name">${appInfo.name || appInfo.bundleName || 'HuaFuSC'}</h1>
        <p class="bundle-id">${appInfo.bundleId || 'com.huaFuSC.app'}</p>

        <div class="info-container">
            <div class="info-column">
                <div class="info-box">
                    <span class="info-label">版本号</span>
                    <span class="info-value">${appInfo.version || 'N/A'}</span>
                </div>
                <div class="info-box">
                    <span class="info-label">Build号</span>
                    <span class="info-value">${appInfo.build || 'N/A'}</span>
                </div>
            </div>
            <div class="info-column">
                <div class="info-box">
                    <span class="info-label">文件大小</span>
                    <span class="info-value">${appInfo.size}</span>
                </div>
                <div class="info-box">
                    <span class="info-label">日期</span>
                    <span class="info-value">${appInfo.date}</span>
                </div>
            </div>
        </div>

        <a href="itms-services://?action=download-manifest&url=manifest.plist" class="install-btn">安装应用</a>

        <p class="footer">由 build.js 自动生成</p>
    </div>
</body>
</html>`;
}

function main() {
    // 检查 IPA 文件是否存在
    if (!fs.existsSync(IPA_PATH)) {
        console.log('⚠️  IPA 文件不存在，跳过构建');
        console.log('   使用已有的 index.html');
        return;
    }

    console.log('🔍 正在解析 IPA 文件...');
    console.log(`   路径: ${IPA_PATH}`);

    const fileSize = fs.statSync(IPA_PATH).size;
    const fileDate = getFileDate(IPA_PATH);

    console.log(`   大小: ${formatFileSize(fileSize)}`);
    console.log(`   日期: ${fileDate}`);

    try {
        const zip = new AdmZip(IPA_PATH);
        const zipEntries = zip.getEntries();

        // 查找主应用的 Info.plist (Payload/XXX.app/Info.plist)
        let plistEntry = null;
        for (const entry of zipEntries) {
            // 匹配 Payload/XXX.app/Info.plist 格式，排除子目录
            const match = entry.entryName.match(/^Payload\/[^/]+\.app\/Info\.plist$/);
            if (match) {
                plistEntry = entry;
                break;
            }
        }

        let appInfo = {
            size: formatFileSize(fileSize),
            date: fileDate
        };

        if (plistEntry) {
            console.log('   找到 Info.plist:', plistEntry.entryName);
            const plistBuffer = zip.readFile(plistEntry);
            const plistDataArray = bplistParser.parseBuffer(plistBuffer);
            const plistData = plistDataArray[0];

            appInfo = {
                ...appInfo,
                name: plistData.CFBundleDisplayName || plistData.CFBundleName,
                version: plistData.CFBundleShortVersionString,
                build: plistData.CFBundleVersion,
                bundleId: plistData.CFBundleIdentifier
            };

            console.log(`   应用名称: ${appInfo.name || 'N/A'}`);
            console.log(`   版本号: ${appInfo.version || 'N/A'}`);
            console.log(`   Build号: ${appInfo.build || 'N/A'}`);
            console.log(`   Bundle ID: ${appInfo.bundleId || 'N/A'}`);
        }

        // 生成 HTML
        const html = generateHTML(appInfo);
        fs.writeFileSync(OUTPUT_PATH, html, 'utf-8');

        console.log(`\n✅ H5 页面已生成: ${OUTPUT_PATH}`);
        console.log('   可以在浏览器中打开查看');

    } catch (error) {
        console.error('❌ 解析失败:', error.message);
        console.log('\n请先安装依赖: npm install adm-zip');
    }
}

main();
