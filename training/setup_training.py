#!/usr/bin/env python3
"""
Setup script to help prepare training data for Agent Lightning
This script helps convert Excel template examples into JSONL format
"""

import json
import sys
import os


def create_sample_training_data():
    """Create a template training_data.jsonl file"""
    print("Creating sample training_data.jsonl...")

    # Check if file already exists
    if os.path.exists("training_data.jsonl"):
        response = input("training_data.jsonl already exists. Overwrite? (y/n): ")
        if response.lower() != 'y':
            print("Skipping...")
            return

    # Copy example file
    if os.path.exists("training_data_example.jsonl"):
        with open("training_data_example.jsonl", "r") as src:
            content = src.read()

        with open("training_data.jsonl", "w") as dst:
            dst.write(content)

        print("✅ Created training_data.jsonl from example")
        print("\nNext steps:")
        print("  1. Edit training_data.jsonl with your actual bank statement examples")
        print("  2. Each line should be a complete JSON object")
        print("  3. Include diverse examples (different banks, account types, etc.)")
        print("  4. Aim for at least 10-20 examples for meaningful training")
    else:
        print("❌ Error: training_data_example.jsonl not found")


def validate_training_data():
    """Validate the training_data.jsonl file format"""
    print("\nValidating training_data.jsonl...")

    if not os.path.exists("training_data.jsonl"):
        print("❌ Error: training_data.jsonl not found")
        print("Run option 1 to create it from the example")
        return

    try:
        with open("training_data.jsonl", "r") as f:
            lines = f.readlines()

        if len(lines) == 0:
            print("❌ Error: training_data.jsonl is empty")
            return

        errors = []
        valid_count = 0

        for i, line in enumerate(lines, 1):
            line = line.strip()
            if not line:
                continue

            try:
                data = json.loads(line)

                # Check required fields
                required_fields = ["statement_text", "borrower_info", "expected_output"]
                missing = [f for f in required_fields if f not in data]

                if missing:
                    errors.append(f"Line {i}: Missing fields: {missing}")
                else:
                    valid_count += 1

            except json.JSONDecodeError as e:
                errors.append(f"Line {i}: Invalid JSON - {str(e)}")

        print(f"\n✅ Found {valid_count} valid training examples")

        if errors:
            print(f"\n⚠️  Found {len(errors)} issues:")
            for error in errors[:5]:  # Show first 5 errors
                print(f"  - {error}")
            if len(errors) > 5:
                print(f"  ... and {len(errors) - 5} more")
        else:
            print("✅ All examples are properly formatted!")

        print(f"\nTraining recommendations:")
        if valid_count < 5:
            print("  ⚠️  Less than 5 examples - add more for better results")
        elif valid_count < 10:
            print("  ⚠️  Less than 10 examples - consider adding more")
        elif valid_count < 20:
            print("  ✅ Good number of examples")
        else:
            print("  ✅ Excellent number of examples!")

    except Exception as e:
        print(f"❌ Error reading file: {e}")


def check_environment():
    """Check if environment is properly set up"""
    print("\nChecking environment...")

    # Check Python version
    print(f"  Python version: {sys.version.split()[0]}")

    # Check for required packages
    required_packages = ['agentlightning', 'openai', 'openpyxl']
    for package in required_packages:
        try:
            __import__(package)
            print(f"  ✅ {package} installed")
        except ImportError:
            print(f"  ❌ {package} NOT installed - run: pip install {package}")

    # Check for API key
    api_key = os.getenv('OPENAI_API_KEY') or os.getenv('VITE_OPENAI_API_KEY')
    if api_key:
        print(f"  ✅ OpenAI API key found (length: {len(api_key)})")
    else:
        print("  ⚠️  OpenAI API key not found in environment")
        print("     Set OPENAI_API_KEY or VITE_OPENAI_API_KEY")

    # Check for system prompt
    system_prompt_path = "../bank-statement-agent-lightning-training-system-prompt.txt"
    if os.path.exists(system_prompt_path):
        print(f"  ✅ System prompt file found")
    else:
        print(f"  ⚠️  System prompt not found at: {system_prompt_path}")


def main():
    """Main setup menu"""
    print("="*70)
    print("Bank Statement Analysis - Agent Lightning Training Setup")
    print("="*70)

    while True:
        print("\nOptions:")
        print("  1. Create sample training_data.jsonl file")
        print("  2. Validate training_data.jsonl")
        print("  3. Check environment setup")
        print("  4. Exit")

        choice = input("\nSelect an option (1-4): ").strip()

        if choice == "1":
            create_sample_training_data()
        elif choice == "2":
            validate_training_data()
        elif choice == "3":
            check_environment()
        elif choice == "4":
            print("\nSetup complete! Next step:")
            print("  python train_bank_statement_agent.py")
            break
        else:
            print("Invalid option. Please select 1-4.")


if __name__ == "__main__":
    main()
