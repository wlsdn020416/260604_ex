const chatForm = document.querySelector("#chatForm");
const chatContainer = document.querySelector("#chatContainer");
const submitButton = chatForm.querySelector("button");
const promptInput = chatForm.querySelector("textarea");
const newChatButton = document.querySelector("#newChatButton");
const chatListButton = document.querySelector("#chatListButton");
const closeDrawerButton = document.querySelector("#closeDrawerButton");
const drawerBackdrop = document.querySelector("#drawerBackdrop");
const chatDrawer = document.querySelector("#chatDrawer");
const chatList = document.querySelector("#chatList");
const providerSelect = chatForm.querySelector('select[name="provider"]');
const modelSelect = chatForm.querySelector('select[name="model"]');
const STORAGE_KEY = "ai-chat-conversations";
const providerModelMap = {
  google: "gemma-4-26b-a4b-it",
  groq: "openai/gpt-oss-120b",
};

const syncModelWithProvider = () => {
  modelSelect.value = providerModelMap[providerSelect.value] || providerModelMap.google;
};

const escapeHTML = (value) =>
  String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });

const renderInlineMarkdown = (value) =>
  value
    .replace(/&lt;br\s*\/?&gt;/gi, "<br>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

const isTableDivider = (line) =>
  /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);

const isTableRow = (line) => line.includes("|") && !isTableDivider(line);

const splitTableCells = (line) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

const renderTable = (rows) => {
  const [header, ...body] = rows.map(splitTableCells);
  const columns = header.length;
  const renderCells = (cells, tag) =>
    Array.from({ length: columns }, (_, index) => {
      const value = cells[index] || "";
      return `<${tag}>${renderInlineMarkdown(escapeHTML(value))}</${tag}>`;
    }).join("");

  return `
    <table>
      <thead><tr>${renderCells(header, "th")}</tr></thead>
      <tbody>${body.map((row) => `<tr>${renderCells(row, "td")}</tr>`).join("")}</tbody>
    </table>
  `;
};

const renderMarkdown = (value) => {
  const lines = String(value).replace(/\r\n?/g, "\n").split("\n");
  const html = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) {
      html.push("<hr>");
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const codeLines = [];
      index += 1;

      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      index += 1;
      html.push(`<pre><code>${escapeHTML(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    if (isTableRow(line) && lines[index + 1] && isTableDivider(lines[index + 1])) {
      const rows = [line];
      index += 2;

      while (index < lines.length && isTableRow(lines[index])) {
        rows.push(lines[index]);
        index += 1;
      }

      html.push(renderTable(rows));
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = Math.min(heading[1].length + 1, 4);
      html.push(`<h${level}>${renderInlineMarkdown(escapeHTML(heading[2]))}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(`<li>${renderInlineMarkdown(escapeHTML(lines[index].replace(/^[-*]\s+/, "")))}</li>`);
        index += 1;
      }
      html.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(`<li>${renderInlineMarkdown(escapeHTML(lines[index].replace(/^\d+\.\s+/, "")))}</li>`);
        index += 1;
      }
      html.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quotes = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quotes.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      html.push(`<blockquote>${renderInlineMarkdown(escapeHTML(quotes.join("<br>")))}</blockquote>`);
      continue;
    }

    const paragraph = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].startsWith("```") &&
      !/^\s*---+\s*$/.test(lines[index]) &&
      !(isTableRow(lines[index]) && lines[index + 1] && isTableDivider(lines[index + 1])) &&
      !/^(#{1,4})\s+/.test(lines[index]) &&
      !/^[-*]\s+/.test(lines[index]) &&
      !/^\d+\.\s+/.test(lines[index]) &&
      !/^>\s?/.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }

    html.push(`<p>${renderInlineMarkdown(escapeHTML(paragraph.join("\n"))).replace(/\n/g, "<br>")}</p>`);
  }

  return html.join("");
};

window.renderMarkdown = renderMarkdown;
document.documentElement.dataset.markdownReady = "true";

const emptyStateHTML = `
  <div class="empty-state" id="emptyState">
    <div class="empty-content">
      <div class="empty-visual" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M7 8h10M7 12h6m8-1c0 4.4-4 8-9 8-1 0-2-.1-2.9-.4L4 20l1.6-4.1A7.2 7.2 0 0 1 3 11c0-4.4 4-8 9-8s9 3.6 9 8Z"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.8"
          />
        </svg>
      </div>
      <strong>무엇을 도와드릴까요?</strong>
      <p>아래 입력창에서 모델을 작게 설정하고 바로 질문을 시작하세요. 답변은 마크다운으로 표시됩니다.</p>
    </div>
  </div>
`;

const createConversation = () => {
  const now = new Date().toISOString();
  return {
    id: `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: "새 채팅",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
};

const loadConversations = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
  }

  return [createConversation()];
};

let conversations = loadConversations();
let activeChatId = conversations[0].id;

const getActiveConversation = () => conversations.find((conversation) => conversation.id === activeChatId);

const saveConversations = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
};

const formatChatDate = (value) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const getChatTitle = (conversation) => {
  const firstUserMessage = conversation.messages.find((message) => message.role === "user");
  return firstUserMessage?.content.slice(0, 34) || conversation.title;
};

const scrollToTop = () => {
  chatContainer.scrollTop = 0;
};

const renderMessage = ({ role, provider, model, content, isError = false, isLoading = false }) => {
  const article = document.createElement("article");
  article.className = `message ${role}${isError ? " error" : ""}${isLoading ? " loading" : ""}`;
  const label = role === "user" ? "나" : provider;
  const avatar = role === "user" ? "나" : "AI";
  const meta = isLoading ? "로딩중" : role === "user" ? "질문" : `${provider} · ${model}`;
  const body = isLoading
    ? `<div class="typing">답변 생성 중<span class="typing-dots" aria-hidden="true"><span></span><span></span><span></span></span></div>`
    : role === "user"
      ? `<p>${escapeHTML(content)}</p>`
      : `<div class="markdown">${renderMarkdown(content)}</div>`;

  article.innerHTML = `
    <div class="message-meta">
      <span class="avatar" aria-hidden="true">${escapeHTML(avatar)}</span>
      <span>${escapeHTML(label)}</span>
      <span>${escapeHTML(meta)}</span>
    </div>
    <div class="bubble">${body}</div>
  `;

  chatContainer.append(article);
  scrollToTop();
  return article;
};

const renderChat = () => {
  const activeConversation = getActiveConversation();
  chatContainer.innerHTML = "";

  if (!activeConversation || activeConversation.messages.length === 0) {
    chatContainer.innerHTML = emptyStateHTML;
    return;
  }

  activeConversation.messages.forEach((message) => renderMessage(message));
  scrollToTop();
};

const renderChatList = () => {
  chatList.innerHTML = conversations
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .map((conversation) => {
      const count = conversation.messages.length;
      const title = escapeHTML(getChatTitle(conversation));
      const meta = `${formatChatDate(conversation.updatedAt)} · 메시지 ${count}개`;

      return `
        <div class="chat-list-item${conversation.id === activeChatId ? " active" : ""}" data-chat-id="${conversation.id}">
          <button class="chat-list-open" type="button" data-open-chat-id="${conversation.id}">
            <strong>${title}</strong>
            <span>${escapeHTML(meta)}</span>
          </button>
          <button class="delete-chat-button" type="button" data-delete-chat-id="${conversation.id}" aria-label="${title} 삭제">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
              />
            </svg>
          </button>
        </div>
      `;
    })
    .join("");
};

const updateAssistantMessage = ({ article, provider, model, content, isError = false }) => {
  article.className = `message assistant${isError ? " error" : ""}`;
  article.innerHTML = `
    <div class="message-meta">
      <span class="avatar" aria-hidden="true">AI</span>
      <span>${escapeHTML(provider)}</span>
      <span>${escapeHTML(`${provider} · ${model}`)}</span>
    </div>
    <div class="bubble">
      <div class="markdown">${renderMarkdown(content)}</div>
    </div>
  `;
  scrollToTop();
};

const addMessageToActiveChat = (message) => {
  const activeConversation = getActiveConversation();
  activeConversation.messages.push(message);
  activeConversation.updatedAt = new Date().toISOString();

  if (message.role === "user" && activeConversation.title === "새 채팅") {
    activeConversation.title = message.content.slice(0, 34) || "새 채팅";
  }

  saveConversations();
  renderChatList();
};

const setActiveChat = (chatId) => {
  activeChatId = chatId;
  renderChat();
  renderChatList();
};

const deleteChat = (chatId) => {
  const deletedIndex = conversations.findIndex((conversation) => conversation.id === chatId);
  if (deletedIndex === -1) return;

  conversations = conversations.filter((conversation) => conversation.id !== chatId);

  if (conversations.length === 0) {
    conversations = [createConversation()];
  }

  if (activeChatId === chatId) {
    const nextConversation = conversations[deletedIndex] || conversations[deletedIndex - 1] || conversations[0];
    activeChatId = nextConversation.id;
    renderChat();
  }

  saveConversations();
  renderChatList();
};

const openDrawer = () => {
  renderChatList();
  chatDrawer.classList.add("open");
  drawerBackdrop.classList.add("open");
};

const closeDrawer = () => {
  chatDrawer.classList.remove("open");
  drawerBackdrop.classList.remove("open");
};

newChatButton.addEventListener("click", () => {
  const conversation = createConversation();
  conversations.unshift(conversation);
  activeChatId = conversation.id;
  saveConversations();
  renderChat();
  renderChatList();
  closeDrawer();
  promptInput.focus();
});

chatListButton.addEventListener("click", openDrawer);
closeDrawerButton.addEventListener("click", closeDrawer);
drawerBackdrop.addEventListener("click", closeDrawer);

chatList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-chat-id]");
  if (deleteButton) {
    deleteChat(deleteButton.dataset.deleteChatId);
    return;
  }

  const openButton = event.target.closest("[data-open-chat-id]");
  if (!openButton) return;

  setActiveChat(openButton.dataset.openChatId);
  closeDrawer();
});

providerSelect.addEventListener("change", syncModelWithProvider);
syncModelWithProvider();
saveConversations();
renderChat();
renderChatList();

promptInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
    return;
  }

  event.preventDefault();
  if (!submitButton.disabled) {
    chatForm.requestSubmit();
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  syncModelWithProvider();

  const formData = new FormData(event.target);
  const ask = formData.get("ask").trim();
  if (!ask) {
    promptInput.focus();
    return;
  }

  const provider = formData.get("provider");
  const model = formData.get("model");
  const userMessage = {
    role: "user",
    provider,
    model,
    content: ask,
    createdAt: new Date().toISOString(),
  };

  addMessageToActiveChat(userMessage);
  renderMessage(userMessage);

  submitButton.disabled = true;
  promptInput.value = "";
  const loadingMessage = renderMessage({
    role: "assistant",
    provider,
    model,
    content: "",
    isLoading: true,
  });

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ provider, model, ask }),
    });

    if (!response.ok) {
      throw new Error("Chat request failed");
    }

    const data = await response.json();
    addMessageToActiveChat({
      role: "assistant",
      provider: data.provider,
      model: data.model,
      content: data.answer,
      createdAt: new Date().toISOString(),
    });
    updateAssistantMessage({
      article: loadingMessage,
      provider: data.provider,
      model: data.model,
      content: data.answer,
    });
  } catch (error) {
    const errorMessage = "요청 처리 중 문제가 발생했습니다. API 키와 서버 로그를 확인해 주세요.";
    addMessageToActiveChat({
      role: "assistant",
      provider,
      model,
      content: errorMessage,
      isError: true,
      createdAt: new Date().toISOString(),
    });
    updateAssistantMessage({
      article: loadingMessage,
      provider,
      model,
      content: errorMessage,
      isError: true,
    });
  } finally {
    submitButton.disabled = false;
    promptInput.focus();
  }
});
