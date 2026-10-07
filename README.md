# AI Chat 임베드 테스트 페이지

교내 Mindlogic AI Chat 외부 임베드 위젯을 확인하기 위한 간단한 페이지입니다.

## 실행 방법

```powershell
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

페이지 오른쪽 아래의 채팅 버튼은 제공받은 외부 임베드 설정으로 표시됩니다. 별도의 API 키를 페이지에 넣지 않아도 됩니다.

실제 외부 웹사이트에 붙일 때는 `public/index.html`의 아래 두 스크립트 블록을 그대로 복사해 사용하면 됩니다.

```html
<script src="https://plugin.factchat.bot/latest/plugin.min.js"></script>
<script>
  window.ChatWidgetConfig = {
    chatUrl: "https://aichat.dongguk.edu/public/chatbots/strange-leakey-arc",
    position: { bottom: 20, right: 20 },
    buttonColor: "#1F687E",
    customImage: "https://factchat-public.s3.ap-northeast-2.amazonaws.com/tenant-logos/3bb059de-0153-4a48-ae12-507107deeafe.jpeg",
    title: "Chat with us",
  };
</script>
```
