# Agent Lightning Training for Bank Statement Analysis

This directory contains the Agent Lightning training setup to optimize the AI agent's system prompt for bank statement income analysis.

## Overview

Agent Lightning uses Automatic Prompt Optimization (APO) to improve the agent's performance by:
1. Testing multiple prompt variations
2. Measuring performance using reward signals
3. Iteratively refining prompts based on results
4. Finding the optimal prompt configuration

## Files

- **`bank_statement_agent.py`** - The agent implementation with Agent Lightning integration
- **`train_bank_statement_agent.py`** - Training script using APO algorithm
- **`training_data.jsonl`** - Your training examples (you need to create this)
- **`training_data_example.jsonl`** - Example format for training data
- **`README.md`** - This file

## Prerequisites

1. Agent Lightning installed (should already be installed)
2. OpenAI API key set in environment: `OPENAI_API_KEY` or `VITE_OPENAI_API_KEY`
3. Training data in JSONL format

## Preparing Training Data

Create a file called `training_data.jsonl` with your bank statement examples. Each line should be a JSON object with:

```json
{
  "statement_text": "Full text extracted from bank statement PDF...",
  "borrower_info": {
    "clientName": "...",
    "businessName": "...",
    "ownershipPercentage": "...",
    "businessType": "...",
    "numEmployees": "...",
    "businessDescription": "..."
  },
  "expected_output": {
    "analysisSummary": {...},
    "qualifiedIncomeCalculation": {...},
    "deposits": [...],
    "timePeriodAggregates": {...},
    "risk": [...]
  }
}
```

**Tips for creating training data:**
- Include diverse examples (different bank formats, business types, etc.)
- Include both simple and complex cases
- Minimum 10-20 examples recommended for meaningful training
- More data = better optimization results

### Using the Excel Template

The `results-tempalte-bank-statement-analysis-worksheet.xlsx` file shows the expected output format. Use this to create your `expected_output` examples.

## Running Training

### Step 1: Verify Setup

```bash
cd training
python bank_statement_agent.py
```

This will test the agent with a dummy example.

### Step 2: Prepare Training Data

Copy and modify the example:
```bash
cp training_data_example.jsonl training_data.jsonl
```

Then edit `training_data.jsonl` with your real examples.

### Step 3: Start Training

```bash
python train_bank_statement_agent.py
```

Training will:
- Load your training examples
- Run the agent with different prompt variations
- Calculate rewards based on output quality
- Optimize the prompt over multiple rounds
- Output the best performing prompts

### Monitoring Training

Training progress is logged to:
- Console output (real-time progress)
- `training.log` file (detailed logs)

The training will show:
- Current beam (prompt variant)
- Validation scores
- Best performing prompts

## Training Configuration

You can adjust these parameters in `train_bank_statement_agent.py`:

```python
algo = APO[BankStatementTask](
    openai_client,
    val_batch_size=5,          # Samples per evaluation
    gradient_batch_size=3,     # Samples for gradient
    beam_width=3,              # Prompt variants to keep
    branch_factor=2,           # New variants per round
    beam_rounds=3,             # Optimization iterations
)
```

**Recommendations:**
- **Quick test**: `beam_width=2, beam_rounds=2`
- **Standard training**: `beam_width=3, beam_rounds=3` (default)
- **Thorough optimization**: `beam_width=5, beam_rounds=5`

## Understanding the Reward Function

The reward function in `bank_statement_agent.py` evaluates output quality:

```python
def calculate_reward(result, expected):
    # Checks for:
    # - Required fields present
    # - Deposits array populated
    # - Qualified income calculated
    # Returns score 0.0 to 1.0
```

**Customize this for your needs!** The reward function determines what the agent optimizes for.

## After Training

1. Review the optimized prompts in the console output
2. Test the best prompt with real bank statements
3. Update your application's system prompt with the optimized version
4. The optimized prompt will be in the Agent Lightning store

To retrieve and use the optimized prompt:
- Check the training logs for the best performing prompt
- Copy it to replace the content in `constants.ts`
- Or use Agent Lightning's resource management to load it dynamically

## Troubleshooting

**"No training data found"**
- Create `training_data.jsonl` with your examples
- See `training_data_example.jsonl` for format

**API errors**
- Verify OPENAI_API_KEY is set: `echo $OPENAI_API_KEY` (Linux/Mac) or `echo %OPENAI_API_KEY%` (Windows)
- Check API rate limits
- Consider using `gpt-4o-mini` for lower costs during training

**Low rewards**
- Review the reward function logic
- Check if expected_output format matches actual output
- Add more training examples
- Adjust reward function to better capture quality

**Out of memory**
- Reduce `n_runners` in Trainer
- Reduce `val_batch_size` and `gradient_batch_size`
- Use smaller examples

## Advanced Usage

### Custom Reward Functions

Edit `calculate_reward()` in `bank_statement_agent.py` to:
- Weight different output fields differently
- Check for specific patterns or validations
- Compare numerical accuracy
- Evaluate risk assessment quality

### Multi-stage Training

1. Train on simple examples first
2. Use the optimized prompt as baseline for complex examples
3. Fine-tune on edge cases

### Evaluation

After training, evaluate on a held-out test set:
```python
# Add to train_bank_statement_agent.py
dataset_test = load_bank_statement_tasks("test_data.jsonl")
# Evaluate with best prompt
```

## Resources

- [Agent Lightning Documentation](https://microsoft.github.io/agent-lightning/)
- [APO Algorithm Guide](https://microsoft.github.io/agent-lightning/stable/how-to/train-first-agent/)
- [Custom Algorithms](https://microsoft.github.io/agent-lightning/stable/how-to/write-first-algorithm/)

## Next Steps

1. ✅ Create training_data.jsonl with your examples
2. ✅ Run training: `python train_bank_statement_agent.py`
3. ✅ Review and test optimized prompts
4. ✅ Integrate best prompt into production application
5. ✅ Monitor performance and iterate

Happy training! ⚡
