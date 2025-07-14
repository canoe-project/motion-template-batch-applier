var title = "일반자막 -랑새";
var path = "D:/programming/play ground/랑새.srt";

function padZero_(num, size) {
  var s = num.toString();
  while (s.length < size) {
    s = "0" + s;
    s = "0" + s;
  }
  return s;
}

// 자막 시간 포맷 파싱 함수 (00:00:01,000 → 밀리초)
function myTrim(str) {
  return String(str).replace(/^\s+|\s+$/g, "");
}

function parseSrtTime(srtTime) {
  if (!srtTime || srtTime.indexOf(':') === -1) return 0;

  var parts = myTrim(srtTime).split(':');
  if (parts.length !== 3) return 0;

  var hours = parseInt(parts[0], 10);
  var minutes = parseInt(parts[1], 10);
  var seconds = parseFloat(parts[2].replace(',', '.'));

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return 0;

  return (hours * 3600 + minutes * 60 + seconds) * 1000;
}

// .srt 파일을 파싱해서 자막 배열로 반환
function readSrtFile(filePath) {
  var file = new File(filePath);
  if (!file.exists) {
      alert("파일이 없어요: " + filePath);
      return [];
  }

  file.open('r');
  var content = file.read();
  file.close();

  var blocks = content.split(/\r?\n\r?\n/);
  var subtitles = [];

  for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      if (!block || typeof block !== "string") continue;

      var linesRaw = block.split(/\r?\n/);
      var lines = [];

      for (var j = 0; j < linesRaw.length; j++) {
          var lines = [];
          for (var j = 0; j < linesRaw.length; j++) {
              var line = linesRaw[j];
          
              if (line === undefined || line === null) continue;
          
              // 강제로 문자열 변환 후 trim 사용 (가장 안전)
              var cleanLine = String(line).replace(/^\s+|\s+$/g, "");
              if (cleanLine !== "") {
                  lines.push(cleanLine);
              }
          }
          
      }

      if (lines.length < 3) continue;

      var timeLine = lines[1];
      if (!timeLine || timeLine.indexOf('-->') === -1) continue;

      var timeParts = timeLine.split(' --> ');
      if (timeParts.length !== 2) continue;

      var start = (timeParts[0] || "").replace(/^\s+|\s+$/g, "");
      var end = (timeParts[1] || "").replace(/^\s+|\s+$/g, "");
      
      if (!start || !end) continue;
      

      var startTime = parseSrtTime(start);
      var endTime = parseSrtTime(end);
      var text = lines.slice(2).join('\n');

      // alert(startTime + " " + endTime + " " + text)
      subtitles.push({
          startTime: startTime,
          endTime: endTime,
          text: text
      });
  }

  return subtitles;
}

// ✨ 자막 텍스트 & 배경 레이어 생성
function createSubtitleLayer(subtitle, comp, index) {
  var comp = app.project.activeItem;
  if (!(comp instanceof CompItem)) {
    alert("먼저 활성화된 컴포지션을 선택해주세요!");
    return;
  }
  if (!comp || !(comp instanceof CompItem)) {
    alert("comp가 유효하지 않습니다.");
    return;
  }
  if (!subtitle || !subtitle.text) {
    alert("subtitle이 유효하지 않습니다.");
    return;
  }
  var masterComp = null;

  for (var i = 1; i <= app.project.items.length; i++) {
      var item = app.project.items[i];
      if (item instanceof CompItem && item.name === title) {
          masterComp = item;
          break;
      }
  }
  if (!masterComp) {
      alert("마스터 템플릿 컴포지션(컴포지션 1)을 찾을 수 없습니다.");
      return;
  }

  var instanceLayer = comp.layers.add(masterComp);

  var layerNumber = padZero_(index + 1, 3);
  instanceLayer.name = "자막_" + layerNumber;
  // 마스터 속성 그룹 가져오기
  var masterProps = instanceLayer.property("Essential Properties");
  if (masterProps) {
      // "이름"과 "내용" 마스터 속성에 텍스트 입력
      // var nameProp = masterProps.property("이름");
      var contentProp = masterProps.property("내용");
      // if (nameProp) nameProp.setValue("나미"); // 필요시 subtitle에서 값 추출
      if (contentProp) contentProp.setValue(subtitle.text);

  }


  // 인/아웃포인트 설정
  instanceLayer.inPoint = subtitle.startTime / 1000;
  instanceLayer.outPoint = subtitle.endTime / 1000;

  // 위치 이동 (예시: comp 하단 중앙)
  instanceLayer.property("Position").setValue([comp.width/2, comp.height/2]);
}

// 실행 메인
function main() {
  var srtFilePath = path; 
  var subtitles = readSrtFile(srtFilePath);

  var comp = app.project.activeItem;
  if (!(comp instanceof CompItem)) {
      alert("먼저 활성화된 컴포지션을 선택해주세요!");
      return;
  }

  app.beginUndoGroup("자막 생성");

  for (var i = 0; i < subtitles.length; i++) {
      createSubtitleLayer(subtitles[i], comp, i);
  }

  app.endUndoGroup();
}

main();