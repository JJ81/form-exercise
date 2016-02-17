(function () {
  'use strict';
  
// 한 번의 DOM탐색으로 각 엘리먼트를 캐싱
var el = {
  id : getSelectorByName('id'),
  email : getSelectorByName('email'),
  email_host : getSelectorByName('email_host'),
  passwd : getSelectorByName('passwd'),
  re_passwd : getSelectorByName('re-passwd'),
  name : getSelectorByName('name'),
  tel_mid : getSelectorByName('tel-mid'),
  tel_end : getSelectorByName('tel-end'),
  usage_agree : getSelectorByName('usage_agree'),
  privacy_agree : getSelectorByName('privacy_agree'),
  reg_form : $("#frm")
};


var validator = {
  types : {}, // 유효성 검사 타입을 연결할 프로퍼티, 검사타입
  config : {}, // 유효성 검사 로직과 대상을 연결해줄 대상
  errors : [], // 스크립트 에러 (내부 에러)
  messages : [], // 클라이언트 에러 (외부 에러)
  
  /*
    @param : {키-값으로 구성된 객체를 전달}
  */
  validate : function (data) {
    var 
    key,
    type,
    checker,
    result_ok;
    
    this.messages = [];
    this.errors = [];
    
    for(type in data){ // 데이터를 통해서 들어온 키를 점검
      if(data.hasOwnProperty(type)){ // 해당 객체의 프로퍼티인지 확인하고 (이 과정이 꼭 필요한 이유는??)
        key = type;
        type = this.config[type]; // type에 검사방법을 바인딩한다.
        
        checker = this.types[type]; // 등록한 검사방법을 찾아서 checker에 바인딩한다.
        // 그런데 검사방법이 동시에 두 개 이상 실행해야 할 경우는 어떻게 할 것인가?
        
        if(!type)
          continue;
        
        if(!checker){
          this.errors.push("Please add more validator for " + key);
          continue;
        }

        
        // 각 검사기를 통해서 검사를 시행하여 출력할 결과메시지를 수집한다.
        if(key === 'usage_agree' || key === 'privacy_agree'){
          result_ok = checker.validate(el[key].prop('checked'));  
        }else{
          result_ok = checker.validate(el[key].val());  
        }
        
        if(!result_ok){
          this.messages.push({
            name : key,
            msg : checker.message
          });
        }
        
      }
    }     
    
  },
  
  // 에러가 발생할 경우 처리 (테스트용 메서드)
  hasErrors : function () {
    return this.errors.length !== 0;
  }, // 에러가 발생할 경우 해당 입력폼 근처에 에러 메시지와 폼필드에 라인색을 변경시켜준다.
  
  hasMessages : function () { // 유저에게 전달할 메시지
    return this.messages.length !== 0;
  }
  
};

// 빈 값이 있으면 안 된다.
validator.types.isNotEmpty = {
  validate : function (value){
    return value !== "";
  },
  message : "값을 입력하세요."
};

// 체크박스가 선택되었는지 여부 확인
validator.types.isChecked = {
  validate : function (value){
    return value;
  },
  message : "해당 항목을 선택해주세요."
};

// 휴대폰에 대한 검사는 때로 이렇게 하는 것이 더욱 편리하다.
validator.types.isCellphone = {
  validate : function (value) {
    var ret = true;
    
    if(value === ""){
      ret = false;
      this.message = "값을 입력하세요.";
    }else{
      if(containHangul(value)){
        ret = false;
        this.message = "한글 입력은 불가능합니다.";
      }else{
        if(value.length < 3){
          ret = false;
          this.message = "휴대폰번호를 확인해주세요.";
        }
      }
    }
    
    return ret;
  },
  message : "휴대폰 번호를 확인해주세요."
};

/*
  1. 대문자, 숫자, 특수문자가 하나 이상 포함될 것.
  2. 최소 6자리에서 최대 16자리까지 가능할 것.
  3. 비번에 아이디가 포함되지 않을 것.
*/
validator.types.validatePasswd = { // 여러가지 형태로 유효성검사를 진행해야 한다.
  validate : function (value){
    var ret = true;
    
    if(value.length < 6 || value.length > 16){
      ret = false;
      this.message = "비밀번호는 최소 6자리에서 최대 16자리를 입력할 수 있습니다.";
    }else{
      if(!/[A-Z]/.test(value)){ // 대문자 검사 (재활용을 위해서 외부 함수로 구성할 것.)
        ret = false;
        this.message = "비밀번호에는 대문자를 한 개 이상 포함하고 있어야 합니다.";
      }else{
        if(!/[0-9]/.test(value)){ // 숫자 검사 (재활용)
          ret = false;
          this.message = "비밀번호에는 숫자가 한 개 이상 포함하고 있어야 합니다.";
        }else{
          if(!/^(?=.*[!@#\$%\^&\*]).+$/.test(value)) { // 특수 문자, 재활용 
            ret = false;
            this.message = "비밀번호에 한 개 이상 특수문자를 포함하고 있어야 합니다.";
          }else{
            if(value.indexOf(el.id.val()) !== -1){ // 아이디와 중복 여부
              ret = false;
              this.message = "비밀번호에 아이디를 포함하고 있지 않아야 합니다.";
            }else{
              if(el.passwd.val() !== el.re_passwd.val()){// 비밀번호 일치
                ret = false;
                this.message = "비밀번호가 일치 하지 않습니다.";
              }
            }
          }
        }
      }
    }
    
    return ret;
  },
  message : "비밀번호를 확인해주세요."
};


// 초기화를 해야 하는데 undefined or null 중 어떻게 처리하는 것이 더 좋을까?
var data = {
  id : undefined,
  email : undefined,
  email_host : undefined,
  passwd : undefined,
  re_passwd : undefined,
  name : undefined,
  tel_mid : undefined,
  tel_end : undefined,
  usage_agree : undefined,
  privacy_agree : undefined
};


validator.config = {
  id : "isNotEmpty",
  email : "isNotEmpty",
  email_host : "isNotEmpty",
  passwd : "validatePasswd",
  re_passwd : "validatePasswd",
  name : "isNotEmpty",
  tel_mid : "isCellphone",
  tel_end : "isCellphone",
  usage_agree : "isChecked",
  privacy_agree : "isChecked"
};


el.reg_form.submit(function (event) {
  
  validator.validate(data);

  // 내부 오류 검사
  if(validator.hasErrors()){
    console.error(validator.errors.join("\n"));
    return false;
  }
  
  // 외부 오류 검사
  if(validator.hasMessages()){
    // 메시지들을 폼에 처리해준다.
    console.info(validator.messages);
    return false;
  }
});


el.tel_mid.bind("keydown", function(event){ // tab과 커서가 작동될 수 있도록 변경할 것. delete는 현재 가능함.
  if(keyEventChecker(event)){
    event.preventDefault();
  }
});


el.tel_end.bind("keydown", function(event){ // tab & 커서가 가능하도록 변경할 것.
  if(keyEventChecker(event)){
    event.preventDefault();
  }
});

// name을 통한 DOM 선택
function getSelectorByName(name){
  return $("#frm input[name='"+name+"']");
}

// 한글이 포함되었는지 여부 확인
function containHangul(value){
  return /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(value);
}
  /*
    tab, cursor, delete만 허용
  */
  function keyEventChecker(event){
    return !(event.which >= 48 && event.which <= 57) && // number
      event.which !== 8 && // delete
      event.which !== 9 && // tab
      !(event.which >= 37 && event.which <= 40); // cursor
  }
  
}());
