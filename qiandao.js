// @编码 UTF-8
// Loon自动签到脚本 - iOS沙师弟VIP
// 名称: 哈士奇自动签到
// 作者: 您的名称
// 描述: 自动登录并点击签到按钮完成每日签到

(function() {
    'use strict';
    
    const CONFIG = {
        TASK_NAME: "哈士奇自动签到",
        LOGIN_URL: "https://vip.ioshashiqi.com/aspx3/mobile/login.aspx",
        CHECKIN_URL: "https://vip.ioshashiqi.com/aspx3/mobile/qiandao.aspx",
        USER_CENTER_URL: "https://vip.ioshashiqi.com/aspx3/mobile/usercenter.aspx?action=index",
        ACCOUNT: {
            USERNAME: "13758655685",
            PASSWORD: "chengjun1993"
        }
    };

    // 主函数
    async function main() {
        console.log(`开始执行${CONFIG.TASK_NAME}`);
        
        try {
            // 执行登录
            const loginResult = await performLogin();
            if (!loginResult.success) {
                throw new Error(`登录失败: ${loginResult.message}`);
            }
            
            console.log("登录成功，开始执行签到...");
            
            // 获取签到页面信息
            const checkInInfo = await getCheckInPageInfo();
            if (checkInInfo.alreadyChecked) {
                console.log("今日已签到，无需重复签到");
                const userInfo = await getUserInfo();
                await sendNotification(userInfo, {success: true, message: "今日已签到过", alreadyChecked: true});
                return;
            }
            
            // 执行签到
            const checkInResult = await performCheckIn(checkInInfo);
            
            // 获取用户信息
            const userInfo = await getUserInfo();
            
            // 发送结果通知
            await sendNotification(userInfo, checkInResult);
            
        } catch (error) {
            console.log(`签到过程出错: ${error}`);
            $notification.post(
                `${CONFIG.TASK_NAME} - 错误`,
                "签到过程中出现异常",
                error.message
            );
        }
        
        console.log(`${CONFIG.TASK_NAME}执行完成`);
    }

    // 执行登录函数
    async function performLogin() {
        console.log("正在执行登录...");
        
        const headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh-Hans;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Content-Type": "application/x-www-form-urlencoded",
            "Origin": "https://vip.ioshashiqi.com",
            "Referer": CONFIG.LOGIN_URL
        };
        
        const body = `username=${CONFIG.ACCOUNT.USERNAME}&password=${CONFIG.ACCOUNT.PASSWORD}&remember=1`;
        
        try {
            const response = await $http.post({
                url: CONFIG.LOGIN_URL,
                headers: headers,
                body: body
            });
            
            if (response.status === 200) {
                if (response.body.includes("登录成功") || response.body.includes("退出登录")) {
                    return { success: true, message: "登录成功" };
                } else if (response.body.includes("用户名或密码错误")) {
                    return { success: false, message: "用户名或密码错误" };
                } else {
                    return { success: true, message: "登录状态未知，继续执行" };
                }
            } else {
                return { success: false, message: `HTTP状态码: ${response.status}` };
            }
        } catch (error) {
            return { success: false, message: `登录请求失败: ${error}` };
        }
    }

    // 获取签到页面信息
    async function getCheckInPageInfo() {
        console.log("正在获取签到页面信息...");
        
        try {
            const response = await $http.get({
                url: CONFIG.CHECKIN_URL,
                headers: getCommonHeaders()
            });
            
            if (response.status === 200) {
                if (response.body.includes("今日已签到") || response.body.includes("已签到")) {
                    return { alreadyChecked: true, message: "今日已签到过" };
                }
                return { alreadyChecked: false, pageContent: response.body };
            } else {
                throw new Error(`获取签到页面失败: HTTP ${response.status}`);
            }
        } catch (error) {
            throw new Error(`获取签到页面信息失败: ${error}`);
        }
    }

    // 执行签到
    async function performCheckIn(checkInInfo) {
        console.log("正在执行签到...");
        
        const headers = {
            ...getCommonHeaders(),
            "Content-Type": "application/x-www-form-urlencoded",
            "Origin": "https://vip.ioshashiqi.com",
            "Referer": CONFIG.CHECKIN_URL
        };
        
        // 尝试直接提交签到请求
        const body = "action=checkin"; // 根据实际情况调整
        
        try {
            const response = await $http.post({
                url: CONFIG.CHECKIN_URL,
                headers: headers,
                body: body
            });
            
            if (response.status === 200) {
                if (response.body.includes("签到成功") || response.body.includes("获得")) {
                    return { success: true, message: "签到成功" };
                } else if (response.body.includes("今日已签到")) {
                    return { success: true, message: "今日已签到过", alreadyChecked: true };
                } else {
                    return { success: false, message: "签到失败，无法确定结果" };
                }
            } else {
                return { success: false, message: `签到请求失败: HTTP ${response.status}` };
            }
        } catch (error) {
            return { success: false, message: `签到过程出错: ${error}` };
        }
    }

    // 获取用户信息
    async function getUserInfo() {
        console.log("正在获取用户信息...");
        
        try {
            const response = await $http.get({
                url: CONFIG.USER_CENTER_URL,
                headers: getCommonHeaders()
            });
            
            if (response.status === 200) {
                return {
                    username: CONFIG.ACCOUNT.USERNAME,
                    vipLevel: "未知",
                    points: "未知",
                    checkInStatus: "未知"
                };
            } else {
                throw new Error(`HTTP状态码: ${response.status}`);
            }
        } catch (error) {
            console.log(`获取用户信息失败: ${error}`);
            return {
                username: CONFIG.ACCOUNT.USERNAME,
                vipLevel: "未知",
                points: "未知",
                checkInStatus: "未知"
            };
        }
    }

    // 获取通用请求头
    function getCommonHeaders() {
        return {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh-Hans;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive"
        };
    }

    // 发送通知
    async function sendNotification(userInfo, checkInResult) {
        const title = checkInResult.success ? 
            `${CONFIG.TASK_NAME} - 成功` : 
            `${CONFIG.TASK_NAME} - 失败`;
        
        let subtitle = "";
        let message = "";
        
        if (checkInResult.success) {
            subtitle = `欢迎, ${userInfo.username}`;
            
            if (checkInResult.alreadyChecked) {
                message = `今日已签到过，无需重复签到\n`;
            } else {
                message = `签到状态: ${checkInResult.message}\n`;
            }
            
            message += `当前积分: ${userInfo.points}\n`;
            message += `VIP等级: ${userInfo.vipLevel}`;
        } else {
            subtitle = "签到失败";
            message = `错误信息: ${checkInResult.message}\n`;
            message += `请检查网络连接或账号状态`;
        }
        
        $notification.post(title, subtitle, message);
    }

    // 执行主函数
    main().catch(e => {
        console.log(`脚本执行出错: ${e}`);
        $notification.post(`${CONFIG.TASK_NAME} - 错误`, "执行过程中出现异常", e.message);
    });
})();