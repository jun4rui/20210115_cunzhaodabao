var mainModel = new Vue({
  el:      '#main',
  data:    {
    currentTab:      0,       //表示当前tab选择第几个，{0:招聘大厅,1:求职大厅}
    companyId:       null,    //企业ID，企业登陆以后会有值
    activityId:      null,    //展会ID
    activityInfo:    null,    //展会信息
    activityPattern: null,    //展会模式
    activityTime:    null,    //展会时间
    companyList:     null,    //企业列表（包括职位）
    danmuList:       null,    //弹幕列表
    danmuNum:        50,      //每次加载弹幕数量
    jobSeekerList:   null,    //求职责列表
    currentRegion:   ''       //当前地区（默认空字符串表示全部

  },
  methods: {
    //获取场次ID
    getActivityId: function() {
      this.activityId = getParameterValue(window.location.href, 'activityid') || '';
      this.activityId = '601';//TODO 测试写死，用完后记得移除
      //没有找到场次ID要报错
      if (!this.activityId) {
        this.$message.error('警告，您的入口不正确，请返回重新进入。');
      }
    },

    //获取招聘会详情
    //获取会场信息
    getActivityInfo: function() {
      $.post(_SERVER + '/activity/getActivityById', {activityId: this.activityId}, function(response) {
        // console.table(response.data);
        if (response.errCode === '00') {
          if (response.data === null) {
            this.$message.error('未找到任何信息');
          } else {
            this.activityInfo    = response.data;
            this.activityPattern = response.data.activityPattern;
            this.activityTime    = response.data.holdingTime;
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
      $.post(_SERVER + '/activity/getSceneAppointmentList', {
        activityId: this.activityId,
        companyId:  this.companyId || ''
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
        } else {
          this.$message.error(response.errMsg);
        }
      }.bind(this));
    }
  },
  created: function() {
    this.getActivityId();// 获取场次ID
    this.getActivityInfo();//获取展会信息
    this.getJobSeekerList();//获取求职者列表
    this.getListActivityCompany();//加载企业和职位信息
    this.getDanmuList();//加载弹幕列表
  },
  mounted: function() {}
});