/*
 * @Descripttion:
 * @version:
 * @Author: zhangchongjie
 * @Date: 2023-06-15 15:19:15
 * @LastEditors: mengjuhua
 * @LastEditTime: 2023-07-10 14:28:17
 * @FilePath: \workspace-y9boot-9.5-liantong-vued:\workspace-y9boot-9.6-vue\y9vue-itemAdmin\src\api\lib\request4Process.js
 */

import settings from '@/settings';
import y9_storage from '@/utils/storage';
import axios from 'axios'; // 考虑CDN
import {ElMessage} from 'element-plus';
import {isExternal} from '@/utils/validate.ts';
import {$y9_SSO} from '@/main';

// 创建一个axios实例
function y9Request(baseUrl = '') {
    let requestList = new Set();

    const service = axios.create({
        baseURL: import.meta.env.VUE_APP_PROCESS_CONTEXT,
        withCredentials: true,
        timeout: 0
    });
    // 请求拦截器
    service.interceptors.request.use(
        (config) => {
            // config.cancelToken = new axios.CancelToken(e => {
            //     console.log(config.url);
            //     // 阻止重复请求
            //     requestList.has(config.url) ? e(`${location.host}${config.url}---重复请求被中断`) : requestList.add(config.url)
            // })
            config.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
            // 自定义
            if (config.cType) {
                config.headers['userLoginName'] = config.data.userLoginName;
            }
            const access_token = y9_storage.getObjectItem(settings.siteTokenKey, 'access_token');
            if (access_token) {
                // console.log("access_token = ",access_token);
                config.headers['Authorization'] = 'Bearer ' + access_token;
            }

            return config;
        },
        (error) => {
            // 处理请求错误
            console.log(error); // for debug
            return Promise.reject(error);
        }
    );

    // 响应拦截器
    service.interceptors.response.use(
        (response) => {
            // 相同请求不得在600毫秒内重复发送，反之继续执行
            setTimeout(() => {
                requestList.delete(response.config.url);
            }, 600);
            if (response.data) {
                return response.data;
            } else {
                return response;
            }
        },
        (error) => {
            // 异常情况
            if (axios.isCancel(error)) {
                // log
                // 请求取消
                console.warn(error);
                // console.table([error.message.split('---')[0]], 'cancel')
            } else if (error.response) {
                // 请求成功发出且服务器也响应了状态码，但状态代码超出了 2xx 的范围
                requestList.delete(error.config.url);
                let data = error.response.data;
                if (error.response.status === 401 && (data.code === 101 || data.code === 102 || data.code === 100)) {
                    // 令牌已失效（过期或其他标签页单点登出）
                    ElMessageBox({
                        title: '提示',
                        showClose: false,
                        closeOnClickModal: false,
                        closeOnPressEscape: false,
                        message: '当前用户登入信息已失效，请重新登入再操作',
                        beforeClose: (action, instance, done) => {
                            if (isExternal(settings.serverLoginUrl)) {
                                window.location.href = settings.serverLoginUrl;
                            } else {
                                $y9_SSO.clearCurrentSessionStorage();
                                window.location.reload();
                            }
                        }
                    });
                } else if (error.response.status === 400) {
                    // 参数、业务上的错误统一返回 http 状态 400，返回原始 body 到请求处自行处理
                    return data;
                }
            }

            ElMessage({
                message: error.message,
                type: 'error',
                duration: 5 * 1000
            });

            return Promise.reject(error);
        }
    );

    return service;
}

export default y9Request;
