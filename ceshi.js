// 脚本名称：测试网络请求
(async () => {
    try {
        const response = await $http.get({
            url: "https://www.example.com"
        });
        console.log(`测试成功：状态码 ${response.statusCode}`);
        $notification.post("测试成功", "", `状态码: ${response.statusCode}`);
    } catch (e) {
        console.log(`测试失败: ${e}`);
        $notification.post("测试失败", "", e.message);
    }
})();