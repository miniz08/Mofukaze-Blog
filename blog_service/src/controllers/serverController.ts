import * as os from 'os';

export class ServerController {
  /**
   * 获取服务器信息（IP地址）
   */
  static async getServerInfo() {
    const osType = os.type();
    const netInfo = os.networkInterfaces();
    let ip = '';

    if (osType === 'Windows_NT') {
      for (const dev in netInfo) {
        console.log('Interface:', dev);
        if (dev === 'WLAN' || dev === '本地连接' || dev === '以太网') {
          for (let j = 0; j < netInfo[dev].length; j++) {
            if (netInfo[dev][j].family === 'IPv4') {
              ip = netInfo[dev][j].address;
              break;
            }
          }
        }
      }
    } else if (osType === 'Linux') {
      ip = netInfo.eth0 ? netInfo.eth0[0].address : '';
    } else if (osType === 'Darwin') {
      // Mac操作系统
      // ip = netInfo.en0[0].address;
    }

    console.log('IP Address:', ip);
    return ip;
  }
}

