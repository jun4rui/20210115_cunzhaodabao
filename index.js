var mainModel = new Vue({
  el:       '#main',
  data:     {
    currentTab:         0,      //表示当前tab选择第几个，{0:招聘大厅,1:求职大厅}
    currentStatus:      0,      //表示当前status选择第几个，{0:全部企业,1:在线企业}
    companyId:          null,   //企业ID，企业登陆以后会有值
    activityId:         null,   //展会ID
    activityInfo:       null,   //展会信息
    activityPattern:    null,   //展会模式
    activityTime:       null,   //展会时间
    activityRecord:     null,   //展会统计数据
    activityDesc:       null,   //展会邀请函内容
    activityDescDialog: false,  //邀请函显示开关
    companyInfoDialog:  false,  //企业详情显示开关（可关注企业）
    recruitListDialog:  false,  //职位列表显示开关（投递简历用）
    resumeInfoDialog:   false,  //简历信息显示开关
    companyList:        null,   //企业列表（包括职位）
    danmuList:          [],     //弹幕列表
    danmuNum:           50,     //每次加载弹幕数量
    reloading:          false,  //是否在装弹？

    loginMode:       null,    //用户登陆带入mode参数的值
    personUserInfo:  null,    //个人用户登陆信息
    companyUserInfo: null,    //企业用户登陆信息

    currentCompanyInfo:    null,//当前企业（信息）
    currentRecruitList:    null,//当前（企业）职位列表
    currentRecruitChecked: '',  //当前职位选择了谁
    currentPositionInfo:   null,//当前职位（信息）
    currentResumeInfo:     null,//当前简历

    jobSeekerList: null,    //求职责列表
    currentRegion: '',       //当前地区（默认空字符串表示全部

    /*聊天相关属性*/
    offlineConversations: [],   //离线会话
    sendMessageList:      [],   //自己发送的信息列表
    messageRecordNum:     0,    //新消息记录数
    chatMessage:          '',   //聊天信息
    receiveMessageList:   [],   //收到信息列表
    conversations:        [],   //会话列表
    targetUser:           {     //目标用户名
      name: '',
      id:   ''
    },
    selfUser:             {     //用户自己的信息
      username: null,
      nickname: null,
      password: null
    },
    chatInfo:             null,  //记录JM必要的信息
    chatFilterStr:        '',    //“入场求职者”过滤关键字（字符串）
    tabName:              'job'    //tab名称
    /*~聊天相关属性*/

  },
  computed: {
    //获取target的id
    targetId:function(){
      return this.targetUser.id.replace(/^[c|p]/g,'').replace(/test$/g,'');
    },
    /*聊天相关*/
    currentMsg:         function() {
      //如果没有当前用户名，就返回空数组
      console.log(`Computed 当前用户是 ${this.targetUser.name} ${this.targetUser.id}`);
      if (this.targetUser.id === '') {
        console.log(`currentMsg 返回空数组，因为没有当前目标用户名 ${this.targetUser.id}`);
        return [];
      }

      //过滤离线信息
      let _offline = [];
      //外层循环，找到对应form_uesr的名字的对话
      for (let item of this.offlineConversations) {
        if (item.from_username === this.targetUser.id) {
          //内层循环，将所有和该用户的对话push到_offline中
          _offline = item.msgs.map(function(msgItem, index) {
            //console.log(`${msgItem.content.from_name} ${index}`);
            return {
              from_username:   msgItem.content.from_name,
              from_id:         msgItem.content.from_id,
              target_username: msgItem.content.target_name,
              message:         msgItem.content.msg_body.text,
              timestamp:       msgItem.content.create_time
            };
          });
        }
      }

      //过滤收到信息
      let _recMsg = [];
      //外层循环，找到对应form_uesr的名字的对话
      for (let item of this.receiveMessageList) {
        if (item.from_username === this.targetUser.id) {
          console.log(`_recMsg有`, item.content.from_name);
          _recMsg.push({
            from_username:   item.content.from_name,
            from_id:         item.content.from_id,
            target_username: item.content.target_name,
            message:         item.content.msg_body.text,
            timestamp:       item.content.create_time
          });
        }
      }
      //发送的消息
      let _sendMsg = [];
      /*_sendMsg     = this.sendMessageList.map(function(msgItem, index) {
       if (msgItem.target_username === this.targetUser.name) {
       console.log(`_sendMsg有`, index, msgItem.from_username);
       return {
       from_username:   msgItem.from_username,
       target_username: msgItem.target_username,
       message:         msgItem.message,
       timestamp:       msgItem.timestamp
       };
       }
       }.bind(this));*/
      this.sendMessageList.map(function(msgItem, index) {
        if (msgItem.target_username === this.targetUser.name) {
          console.log(`_sendMsg有`, index, msgItem.from_username);
          _sendMsg.push({
            from_username:   msgItem.from_username,
            target_username: msgItem.target_username,
            message:         msgItem.message,
            timestamp:       msgItem.timestamp
          });
        }
      }.bind(this));
      console.log(`currentMsg`, _recMsg.length, _recMsg);

      _offline    = _.orderBy(_offline, ['timestamp'], ['asc']);
      let _newMsg = _.concat(_recMsg, _sendMsg);
      _newMsg     = _.orderBy(_newMsg, ['timestamp'], ['asc']);

      let _msg = _.concat(_offline, _newMsg);
      //合并数据
      return _msg;
    },
    chatDiaglogVisible: function() {
      return this.targetUser.id !== '';
    }
    /*~聊天相关*/
  },
  methods:  {
    //获取场次ID
    getActivityId: function() {
      this.activityId = getParameterValue(window.location.href, 'activityid') || '';
      this.activityId = '581';//TODO 测试写死，用完后记得移除
      //没有找到场次ID要报错
      if (!this.activityId) {
        this.$message.error('警告，您的入口不正确，请返回重新进入。');
      }
    },

    //获取招聘会详情
    //获取会场信息
    getActivityInfo: function() {
      //调用接口获取展会详情
      $.post(_SERVER + '/activity/getActivityById', {activityId: this.activityId}, function(response) {
        // console.table(response.data);
        if (response.errCode === '00') {
          if (response.data === null) {
            this.$message.error('未找到任何信息');
          } else {
            this.activityInfo    = response.data;
            this.activityPattern = response.data.activityPattern;
            this.activityTime    = response.data.holdingTime;

            if (response.data.wordpressId) {
              //获取展会邀请函
              this.getHomeAdvertisement(response.data.wordpressId);
            }
          }
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },

    //获取参与公司和职位列表和状态
    getListActivityCompany: function() {
      $.post(_SERVER + '/activity/listActivityCompany', {
        activityId: this.activityId
        // personId:   '1685117',
        // jobTitle:   ''
        // jobTitle:   this.searchKeyword
      }, function(response) {
        // console.log(response.data.length);
        if (response.errCode === '00') {
          this.companyList = response.data;
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },

    //加载求职者列表
    getJobSeekerList: function() {
      $.post(_SERVER + '/activity/getOnsiteAndInvestList', {
        activityId: this.activityId, //TODO 记得改回来
        // activityId: 581
        //holdingTime: this.activityInfo.holdingTime.substr(0, 10),//TODO 如果传companyid，就要传holdtime，这里应该要做一个判断
        //companyId:  this.companyId || '1458',//TODO 看看如果企业登陆没登陆对这个处理是否有影响
      }, function(response) {
        if (response.errCode === '00') {
          this.jobSeekerList = response.data;
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },

    //加载弹幕
    getDanmuList: function() {
      $.post(_SERVER + '/activity/queryBarrage', {
        // activityId: this.activityId,
        activityId: 581,
        num:        this.danmuNum
      }, function(response) {
        if (response.errCode === '00') {
          this.danmuList = response.data;
          console.log('装弹完毕！');
        } else {
          this.$message.error(response.errMsg);
        }
        this.reloading = false;
      }.bind(this));
    },

    //获取邀请函（新闻）详情
    getHomeAdvertisement: function(inId) {
      $.post(_SERVER + '/listAdvert/advertise', {
        id: inId
      }, function(response) {
        if (response.errCode === '00') {
          this.activityDesc = response.data;
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },
    //调用计数器
    addCounter: function() {
      // 设定参数
      var _parameter = {
        'city':      encodeURIComponent(returnCitySN.cname),
        'type':      '4-1-1',
        'url':       window.location.href,
        'ip':        returnCitySN.cip,
        'useragent': encodeURIComponent(navigator.userAgent)
      };
      $.post(_SERVER + '/webBrowsing/add', _parameter, function(result) {/*...*/});
    },
    //查询展会统计数据
    queryWebsiteRecord: function() {
      $.post(_SERVER + '/activity/queryWebSiteRecord', {
        activityId: this.activityId
      }, function(response) {
        if (response.errCode === '00') {
          this.activityRecord = response.data;
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },
    //获取指定企业详情到当前企业信息
    getCurrentCompanyInfo: function(inCompanyId) {
      //首先清空原来的当前企业信息
      this.currentCompanyInfo = null;
      //获取新的当前企业信息，并放到当前企业信息变量中
      //TODO 这里personId是写死为空的，需要根据用户登陆情况，将用户的personId填写进来
      $.post(_SERVER + '/wxCompany/companyMessageByWx', {companyId: inCompanyId, personId: '0'}, function(response) {
        if (response.errCode === '00') {
          this.currentCompanyInfo = response.data;
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },
    //获取制定企业的招聘职位列表
    getRecruitList: function(inCompanyId) {
      //首先清空原来的当前企业职位列表
      this.currentRecruitList = null;
      //获取新的当前企业职位列表ID，并放到当前职位列表变量中
      $.post(_SERVER + '/wxCompany/wxCompanyRecruits', {companyId: inCompanyId}, function(response) {
        if (response.errCode === '00') {
          this.currentRecruitList = response.data;
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },
    //获取指定职位详情到当前职位信息
    getCurrentPositionInfo: function(inPositionId) {
      //首先清空原来的当前职位信息变量
      this.currentPositionInfo = null;
      //获取新的职位信息，并放到当前职位信息变量中
      $.post(_SERVER + '/wxCompany/wxRecruitMessage', {recruitId: inPositionId}, function(response) {
        if (response.errCode === '00') {
          this.currentPositionInfo = response.data;
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },

    //展示当前企业详情信息
    showCurrentCompanyInfo: function(inCompanyId) {
      //console.log('showCurrentCompanyInfo:', inCompanyId);
      this.getCurrentCompanyInfo(inCompanyId);
      this.getRecruitList(inCompanyId);
      this.companyInfoDialog = true;
    },

    //展示特定（用当前职位接口）公司的职位信息
    showRecruitList: function(inCompanyId) {
      this.getRecruitList(inCompanyId);
      this.recruitListDialog = true;
    },

    //在弹出职位列表Dialog窗口投递简历
    recruitListSubmit: function() {
      //检查用户是否登陆，登陆以后才能投递职位
      if(!this.personUserInfo){
        this.$message.error('请您先登陆，然后才能投递简历。');
        return false;
      }
      //进行职位投递操作
      console.log('投递了职位: ', this.currentRecruitChecked);
      this.postResume(this.currentRecruitChecked);

      //清空当前职位选择
      this.currentRecruitChecked = '';
      this.recruitListDialog     = false;
    },

    //查看用户简历
    viewResume: function(inCvId) {
      console.log(`viewResume: ${inCvId}`);
      inCvId = 1413408;//TODO cvid先写死
      if (!inCvId) {
        this.$message.error('未找到该简历');
        return false;
      }
      //清空当前简历变量
      this.currentResumeInfo = null;
      //打开当前简历展现dialog
      this.resumeInfoDialog  = true;
      //从接口获取简历信息到当前简历变量
      //调用接口获取展会详情
      $.post(_SERVER + '/personCenter/listPersonCvInfo', {cvId: inCvId}, function(response) {
        // console.table(response.data);
        if (response.errCode === '00') {
          if (response.data === null) {
            this.$message.error('未找到任何信息');
            this.resumeInfoDialog = false;
          } else {
            this.currentResumeInfo = response.data;
          }
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    },

    //登陆 TODO 可能还需要完善，而且不好测试
    userLogin: function(inMode) {
      if (inMode === 'person') {
        window.localStorage.setItem('backurl', window.location.href.indexOf('?') > -1
            ? window.location.href.substr(0, window.location.href.indexOf('?'))
            : window.location.href + '?mode=person');
        window.location.href = 'http://www.hnrcsc.com/web/seekjob/login.action';
        return false;
      }
      if (inMode === 'company') {
        window.localStorage.setItem('backurl', window.location.href.indexOf('?') > -1
            ? window.location.href.substr(0, window.location.href.indexOf('?'))
            : window.location.href + '?mode=company');
        window.location.href = 'http://www.hnrcsc.com/web/recruit/login.action';
        return false;
      }
    },
    //获取个人用户登陆信息
    getPersonUserInfo: function() {
      //首先清空个人用户和企业用户（感觉其实也没必要）
      this.personUserInfo = this.companyUserInfo = null;
      $.post('http://www.hnrcsc.com/web/seekjob/video!personLogin.action', function(response) {
        if (response.map.status === '00') {
          this.personUserInfo = response.map.user;
          console.log('个人用户已登录！');
          //个人签到
          this.personSign();
          //登陆聊天账号
          this.readyChat();
        } else {
          this.$message.error('个人账号登陆失败！');
        }
      }.bind(this));
    },
    //获取企业用户登陆信息
    getCompanyUserInfo: function() {
      //首先清空个人用户和企业用户（感觉其实也没必要）
      //感觉代码和获取个人账号的一样，也可以考虑合并起来
      this.personUserInfo = this.companyUserInfo = null;
      $.post('http://www.hnrcsc.com/web/recruit/login!checkLogin.action', function(response) {
        if (response.map.status === '00') {
          this.companyUserInfo = response.map.user;
          console.log('企业用户已登录！');
          //企业签到操作
          this.companySign();
          //登陆聊天账号
          this.readyChat();
        } else {
          this.$message.error('企业账号登陆失败！');
        }
      }.bind(this));
    },
    //退出登陆
    logout: function() {
      window.location.href = window.location.href.substr(0, window.location.href.indexOf('?'));
    },
    //聊天(用来拦截以前函数的调用)
    toChat: function(inId, inName) {
      console.log(`toChat: ${inId} ${inName}`);
    },

    /*聊天相关*/
    // 聊天初始化
    chatInit: function() {
      console.log(`Do init.`);
      $.post(_SERVER + '/appointment/getAuthPayload', function(response) {
        console.log(response);
        response.data.flag = 1; //开启漫游
        //初始化
        JIM.init(response.data).onSuccess(function(data) {
          console.log('初始化成功:' + JSON.stringify(data));
          this.chatInfo = response.data;  //将信息保存到info中

          this.register();  //初始化成功以后先注册
          this.login(); //初始化成功后立刻登录
        }.bind(this)).onFail(function(data) {
          console.log('初始化失败:' + JSON.stringify(data));
        });
      }.bind(this));
    },
    //开始和个人聊天 只有企业登陆以后才能调用
    chatToPerson: function(inPersonName, inPersonId) {
      console.log(`开始聊天（企业），企业ID：${inPersonName} ${inPersonId}`);

      if(this.companyUserInfo===null){
        this.$message.error('请登陆企业账号，并确认已参加该场招聘会。');
        return false;
      }
      this.$message.info(`开始聊天（企业）：${inPersonName} ${inPersonId}`);
      this.tabName    = 'chat';
      this.targetUser = {
        name: inPersonName,
        id:   'p' + inPersonId.toString() + 'test' //TODO 测试中，加入后缀_test
      };
    },
    //开始和企业聊天 只有个人登陆以后才可以调用
    chatToCompany: function(inCompanyName, inCompanyId) {
      console.log(`开始聊天（求职者），企业ID：${inCompanyName} ${inCompanyId}`);

      if(this.personUserInfo===null){
        this.$message.error('请先登陆个人账号，才能和企业进行沟通。');
        return false;
      }
      this.targetUser = {
        name: inCompanyName,
        id:   'c' + inCompanyId.toString() + 'test' //TODO 测试中，加入后缀_test
      };

      this.getCurrentCompanyInfo(inCompanyId.toString());
      this.getRecruitList(inCompanyId.toString());
    },
    // 聊天用户注册
    register: function() {
      console.log('开始注册用户：', this.selfUser);
      JIM.register(this.selfUser).onSuccess(function(data) {
        //data.code 返回码
        //data.message 描述
        console.log('注册成功', data.code, data.message);
      }).onFail(function(data) {
        // 同上
        console.log('注册失败', data.code, data.message);
      });
    },
    // 聊天用户登陆
    login: function() {
      console.log('用户登录', this.selfUser);
      this.selfUser.password = '88888888';
      JIM.login(this.selfUser).onSuccess(function(data) {
        //data.code 返回码
        //data.message 描述
        //data.online_list[] 在线设备列表
        //data.online_list[].platform  Android,ios,pc,web
        //data.online_list[].mtime 最近一次登录时间
        //data.online_list[].isOnline 是否在线 true or false
        //data.online_list[].isLogin 是否登录 true or false
        //data.online_list[].flag 该设备是否被当前登录设备踢出 true or false
        console.log(`登陆成功 ${data.code} ${data.message}`);

        //用户登陆成功以后，更新用户信息
        JIM.updateSelfInfo({
          'nickname': this.selfUser.nickname
        }).onSuccess(function(data) {
          //data.code 返回码
          //data.message 描述
          console.log('更新用户信息成功');
        }).onFail(function(data) {
          //同上
          console.log('更新用户信息失败');
        });

        //调用获取会话列表
        this.getConversation();
        this.onSyncConversation();
      }.bind(this)).onFail(function(data) {
        //同上
        console.log(`登陆失败 ${data.code}`);
      });
    },
    // 监控业务事件
    onEventNotification: function() {
      JIM.onEventNotification(function(data) {
        console.log(`业务事件监听：`, data);
        var _errMsg = '';
        switch (data.event_type.toString()) {
          case '1': //同时登录或者被禁用，被迫下线
            _errMsg = '对话功能因为账号同时登录或者被禁用，被迫下线。您可以重新登陆或刷新页面再次上线。';
            break;
          case '2':
            _errMsg = '对话功能因为密码被修改，被迫下线示例';
            break;
        }

        if (_errMsg !== '') {
          this.$notify.warning({
            title:                    '警告',
            dangerouslyUseHTMLString: true,
            message:                  _errMsg,
            duration:                 0
          });
        }
      }.bind(this));
    },
    // 聊天发送消息comp`
    sendMessage: function(inMsgStr) {
      if (this.targetUser.id === '') {
        alert('请选择一个用户');
        return false;
      }
      //检测是否在线
      if (!JIM.isConnect()) {
        this.$message.error('和对话服务器的网络连接已断开，无法发送消息。您可以刷新页面或者重新登陆后再发送。');
        return false;
      }

      //检测是否登陆
      if (!JIM.isLogin()) {
        this.$message.error('可能因为账号在其它地方登陆所致您已退出登录，无法发送信息。您可以刷新页面或者重新登陆后再发送。');
        return false;
      }

      JIM.sendSingleMsg({
        // 'target_username': this.targetUsername,
        'target_username': this.targetUser.id,
        'content':         inMsgStr,
        'appkey':          this.chatInfo.appkey
      }).onSuccess(function(data, msg) {
        console.log('发送消息', data.code, data.message, data.target_username);
        //data.code 返回码
        //data.message 描述
        //data.msg_id 发送成功后的消息 id
        //data.ctime_ms 消息生成时间,毫秒
        //data.appkey 用户所属 appkey
        //data.target_username 用户名
        //msg.content 发送成功消息体,见下面消息体详情
        this.sendMessageList.push(
            {
              from_username:   this.selfUser.nickname,
              from_id:         this.selfUser.id,
              target_username: this.targetUser.name,
              message:         inMsgStr,
              timestamp:       new Date().getTime()
            }
        );
      }.bind(this)).onFail(function(data) {
        //data.code 返回码
        //data.message 描述
        console.log(`发送消息失败： ${data.code} ${data.message}`);
        var _errMsg = '发送消失失败，可能是对方未上线';
        switch (data.code.toString()) {
          case '882004':
            _errMsg = '对话功能授权失败，可能该账号在其它地方登录导致被踢，您可以刷新重新使用对话功能。';
            break;
          default:
            break;
        }
        this.$message.error(_errMsg);

      }.bind(this));
    },
    // 聊天未读会话数清零
    resetUnreadCount: function(inUsername) {
      JIM.resetUnreadCount({
        'username': inUsername
      });
    },
    // 聊天获取会话列表
    getConversation: function() {
      if (!JIM.isLogin()) {
        console.log('尚未登陆，放弃getConversation');
        return false;
      }

      JIM.getConversation().onSuccess(function(data) {
        console.log(`会话列表: ${data.code} ${data.message}`);
        console.log(data);
        // this.conversations = data.conversations;
        this.conversations = _.reverse(_.sortBy(data.conversations, ['unread_msg_count']));
        //20200921 更新，过滤掉该场展会之前的消息
        /*TODO 测试期间因为没有数据，所以暂时就不做过滤了
        this.conversations = mainModel.conversations.filter(item => {
          let _msgTime      = new Date(item.mtime).getTime();
          let _activityTime = new Date(mainModel.activityInfo.holdingTime).getTime();
          return _msgTime > _activityTime;
        });*/
        //data.code 返回码
        //data.message 描述
        //data.conversations[] 会话列表，属性如下示例
        //data.conversations[0].extras 附加字段
        //data.conversations[0].unread_msg_count 消息未读数
        //data.conversations[0].name  会话名称
        //data.conversations[0].appkey  appkey(单聊)
        //data.conversations[0].username  用户名(单聊)
        //data.conversations[0].nickname  用户昵称(单聊)
        //data.conversations[0].avatar  头像 media_id
        //data.conversations[0].mtime 会话最后的消息时间戳
        //data.conversations[0].gid 群 id(群聊)
        //data.conversations[0].type  会话类型(3 代表单聊会话类型，4 代表群聊会话类型)
      }.bind(this)).onFail(function(data) {
        //data.code 返回码
        //data.message 描述
        console.log(`会话列表: ${data.code} ${data.message}`);
      });
    },
    // 聊天离线消息同步监听
    onSyncConversation: function() {
      JIM.onSyncConversation(function(data) {
        console.log(`离线消息同步监听`);
        console.log(data);
        console.log(data[0]);
        console.log(data[1]);
        this.offlineConversations = data;
        // data[]
        // data[].msg_type 会话类型
        // data[].from_appey 单聊有效
        // data[].from_username 单聊有效
        // data[].from_gid 群聊有效
        // data[].unread_msg_count 消息未读数
        // 消息已读回执状态，针对自己发的消息
        // data[].receipt_msgs[]
        // data[].receipt_msgs[].msg_id
        // data[].receipt_msgs[].unread_count
        // data[].receipt_msgs[].mtime
        // 消息列表
        // data[].msgs[]
        // data[].msgs[].msg_id
        // data[].msgs[].content
        // data[].msgs[].msg_type
        // data[].msgs[].ctime_ms
        // data[].msgs[].need_receipt
        // data[].msgs[].custom_notification.enabled
        // data[].msgs[].custom_notification.title
        // data[].msgs[].custom_notification.alert
        // data[].msgs[].custom_notification.at_prefix
      }.bind(this));
    },
    // 聊天读取信息
    readMsg: function(inUsername, inUserId) {
      console.log(`读取信息： ${inUsername} ${inUserId}`, event.target);
      this.targetUser = {
        name: inUsername,
        id:   inUserId
      };
      // 清空未读会话数
      this.resetUnreadCount(inUserId);
      //如果是c开头的企业，则调用接口获取企业信息
      if(this.targetUser.id.indexOf('c')===0){
        this.getCurrentCompanyInfo(this.targetId);
        this.getRecruitList(this.targetId);
      }
    },
    // 聊天启动步骤
    chatStartup: function() {
      // window.JIM = new JMessage({debug: true});
      window.JIM = new JMessage({debug: false});

      //异常断线监听
      JIM.onDisconnect(function() {
        console.log('连接断线');
        this.$notify.warning({
          title:                    '警告',
          dangerouslyUseHTMLString: true,
          message:                  '连接断线，可能同一账号在其它地方登陆，您可以尝试刷新或重新登陆',
          duration:                 0
        });
        //this.login(); //重新连接
      }.bind(this));

      //接收消息
      JIM.onMsgReceive(function(data) {
        for (let item of data.messages) {
          this.receiveMessageList.push(item);
        }
        console.log('收到消息:', data, JSON.stringify(data));
        // console.log(data);
      }.bind(this));

      //不停刷新会话列表
      setInterval(function() {
        this.getConversation();
      }.bind(this), 5000);

      //调用初始化
      this.chatInit();
    },
    //清空当前聊天对象
    clearChatTargetUser: function() {
      this.targetUser = {
        name: '',
        id:   ''
      };
    },
    //点击发送按钮，发送聊天消息
    //调用导致堆栈溢出，暂时注释掉
    sendChatMessage: function() {
      if (this.chatMessage !== '') {
        this.sendMessage(this.chatMessage);
        this.chatMessage = '';
      } else {
        this.$message.error('请不要发送空信息');
      }
    },
    //点击了选项卡
    mainTabClick: function() {
      //如果从“在线沟通”切换出去，就记录下当前收到消息的数量
      if (this.tabName !== 'chat') {
        this.messageRecordNum = this.receiveMessageList.length;
      }
    },
    /*~聊天相关*/

    //新增的，用来自动获取取得用户类型，并确定用哪种方式启动聊天。函数在用户登陆成功后调用
    readyChat: function() {
      //如果聊天没有初始化（根据是否有selfUser.nickname判断），则调用聊天初始化
      if (this.selfUser.nickname === null) {

        //设置聊天账号
        //如果是企业
        if (this.loginMode === 'company') {
          this.selfUser = {
            username: 'c' + this.companyUserInfo.companyId.toString() + 'test',  //TODO 测试中，加后缀_test,
            nickname: this.companyUserInfo.companyName,
            password: '88888888'
          };
        }
        //如果是个人
        if (this.loginMode === 'person') {
          this.selfUser = {
            username: 'p' + this.personUserInfo.personId.toString() + 'test',  //TODO 测试中，加后缀_test,,
            nickname: this.personUserInfo.personName,
            password: '88888888'
          };
        }

        //聊天启动步骤
        this.chatStartup();
      }
    },

    //个人签到
    personSign: function() {
      //检查信息是否齐全
      if (this.personUserInfo === null || this.activityId === null) {
        console.log('个人签到失败，参数不全');
        return false;
      }
      //调用接口进行签到操作
      $.post(_SERVER + '/personActivity/personSign', {
        personId:   this.personUserInfo.personId,
        activityId: this.activityId
      }, function(response) {
        if(response.errCode==='00') {
          console.log('个人签到成功！',response);
        }else{
          this.$message.error('签到失败！'+response.errMsg);
          //个人失败是否要清空个人登陆信息？
        }
      });
    },
    //企业签到
    companySign:function(){
      //检查信息是否齐全
      if (this.companyUserInfo === null || this.activityId === null) {
        console.log('企业签到失败，参数不全');
        return false;
      }

      //调用报名签到接口
      $.post(_SERVER + '/enterprise/invitationAndSign', {activityId: this.activityId, companyId:  this.companyUserInfo.companyId, sceneType: 1/*1是签到模式*/}, function(response) {
        if (response.errCode === '00') {
          //签到成功操作暂不处理
          console.log('企业签到成功！',response);
        } else {
          this.$message.error('企业签到失败！'+response.errMsg);
          this.companyUserInfo = null;//签到失败，就清空企业信息
        }
      }.bind(this));
    },

    //聊天用查看公司详情
    chatViewCompanyInfo:function(){
      //设定当前企业为target企业
      this.getCurrentCompanyInfo(this.targetId);
      this.getRecruitList(this.targetId);

      $('#chat-area_other .video-chat').attr('src','');//为了节省资源和保证企业聊天离线完成，一定要清空聊天iframe
      $('#chat-area_other .model').removeClass('active');
      $('#chat-area_other .company-info.model').addClass('active')
      ;
    },
    //聊天用查看个人简历
    chatViewPersonResume:function(){
      $('#chat-area_other .video-chat').attr('src','');//为了节省资源和保证企业聊天离线完成，一定要清空聊天iframe
    },
    //聊天用打开视频聊天
    chatViewVideo:function(){
      //区分当前账号是个人还是公司
      //个人方式
      if (this.personUserInfo!==null){
        $('#chat-area_other .video-chat').attr('src','https://www.hnrcsc.com/videochat/client.html?personid='+this.personUserInfo.personId+'&companyid='+(this.targetId));
      }
      //企业方式
      if(this.companyUserInfo!==null){
        $('#chat-area_other .video-chat').attr('src','https://www.hnrcsc.com/videochat/hr.html?companyid='+this.companyUserInfo.companyId+'&orderid='+this.companyUserInfo.orderId);
      }

      $('#chat-area_other .model').removeClass('active');
      $('#chat-area_other .video-chat.model').addClass('active');
    },

    //投递简历
    postResume:function(inRecruitId){
      if(!this.personUserInfo){
        this.$message.error('您登陆以后才可以投递简历');
        return false;
      }
      console.log('投递简历：',inRecruitId);

      let _params    = {
        recruitId: inRecruitId,
        personId:  this.personUserInfo.personId
      };
      //设定接口
      let _interface = '/RecruitEdismax/recruitApply';  //默认线上投递
      if (this.activityInfo.activityPattern === 1) _interface = '/RecruitEdismax/recruitApply';
      if (this.activityInfo.activityPattern === 2) _interface = '/wxCompany/recruitApplySite';
      /*暂时不考虑校招的情况 if (this.activityPattern === 3) _interface = '/wxCompany/recruitApplySite';*/
      $.post(_SERVER + _interface, _params, function(response) {
        if (response.errCode === '00') {
          this.$message.success('简历投递成功');
        } else {
          if (response.errMsg.indexOf('没有默认简历') > -1 ||
              response.errMsg.indexOf('简历已经作废') > -1 ||
              response.errMsg.indexOf('简历不完善') > -1) {
            this.$notify.warning({
              title:                    '提醒',
              dangerouslyUseHTMLString: true,
              message:                  '您的简历还不完善，将无法投递职位和面试，请点击<a href="person_register.html">这里</a>进行完善',
              duration:                 0
            });
          } else {
            //其它情况的处理
            this.$message.error(response.errMsg);
          }
        }
      }.bind(this));
    }
  },
  created:  function() {
    //如果有参数mode，则根据mode的值来获取用户信息
    this.loginMode = getParameterValue(window.location.href, 'mode');
    if (this.loginMode === 'person') this.getPersonUserInfo();
    if (this.loginMode === 'company') this.getCompanyUserInfo();

    this.getActivityId();//获取场次ID
    this.addCounter();//调用计数器
    this.getActivityInfo();//获取展会信息
    this.getJobSeekerList();//获取求职者列表
    this.getListActivityCompany();//加载企业和职位信息
    this.queryWebsiteRecord();//查询展会数据
    /*装载弹幕*/
    this.reloading = true;
    this.getDanmuList();//加载弹幕列表
    /*TODO 一些数据要定时进行刷新*/
    // 入场求职者的状态
    // 企业和职位状态
  },
  mounted:  function() {
    //全自动弹幕发射机器
    setInterval(function() {
      //如果没子弹了，就重新装载子弹
      if (this.danmuList.length === 0 && !this.reloading) {
        console.log('重新装弹中');
        this.reloading = true;
        this.getDanmuList();//加载弹幕列表
        return false;
      }
      //发射从弹幕池动态获取最上面的弹幕
      // TODO 弹幕先关了，看着烦
      $('#danmu').barrager({
        img:   'images/icon_danmu_avatar.png',
        info:  this.danmuList.splice(0, 1),
        speed: parseInt(Math.random() * 5) + 15
      });

    }.bind(this), 3000);

    //DEBUG
    setTimeout(function() {
      // $('.company_name').eq(0).click();
    }, 3000);
  }
});