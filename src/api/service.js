const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// 你的 DeepSeek API Key（务必从环境变量读取，不要硬编码）
const DEEPSEEK_API_KEY = 'sk-3b6724be03914091aad36b5b3be63ec1';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

// 一个极其专业的提示词，这是成功的关键！
const SYSTEM_PROMPT = `你是一个专业的生物信息学分析助手。用户会向你描述一个生物信息学数据分析需求。

你的核心任务是：生成**完整、可立即运行、无缺失**的 R 或 Python 代码。
代码要求：
1. 必须是完整的脚本，包含所有必要的库安装（如必要）、数据读取、分析和可视化步骤。
2. 在代码中，使用注释清晰说明每一步的目的。
3. 假设输入数据文件为 'data.csv'，列名包含 'gene_id', 'group', 'expression_value'。
4. 最后，将结果（如图表、表格）保存为文件，并打印关键结论。
请只返回代码，不要有多余的解释。`;

app.post('/api/analyze', async (req, res) => {
  const userQuestion = req.body.question; // 例如：“请帮我做一下组A和组B的差异表达分析，用火山图展示结果”

  try {
    const response = await axios.post(
      DEEPSEEK_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userQuestion }
        ],
        temperature: 0.1 // 低温度使输出更确定，适合生成代码
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const generatedCode = response.data.choices[0].message.content;
    res.json({ code: generatedCode });

  } catch (error) {
    console.error('调用API失败:', error);
    res.status(500).json({ error: '分析请求失败，请稍后重试' });
  }
});

app.listen(3000, () => console.log('助手服务运行在 http://localhost:3000'));