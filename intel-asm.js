(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("intel-asm", function(config, parserConfig) {
    var instructions = /^(aaa|aad|aam|aas|adc|add|and|arpl|bb0_reset|bb1_reset|bound|bsf|bsr|bswap|bt|btc|btr|bts|call|cbw|cdq|clc|cld|cli|clts|cmc|cmp|cmpsb|cmpsd|cmpsw|cmpxchg|cmpxchg486|cpuid|cwd|cwde|daa|das|dec|div|emms|enter|hlt|ibts|icebp|idiv|imul|in|inc|insb|insd|insw|int|int01|int03|int1|int3|into|invd|invlpg|iret|iretd|iretf|ja|jae|jb|jbe|jc|jcxz|je|jecxz|jg|jge|jl|jle|jmp|jna|jnae|jnb|jnbe|jnc|jne|jng|jnge|jnl|jnle|jno|jnp|jns|jnz|jo|jp|jpe|jpo|js|jz|lahf|lar|lds|lea|leave|les|lfs|lgdt|lgs|lidt|lldt|lmsw|lock|lodsb|lodsd|lodsw|loop|loope|loopne|loopnz|loopz|lsl|lss|ltr|mov|movd|movq|movsb|movsd|movsw|movsx|movzx|mul|neg|nop|not|or|out|outsb|outsd|outsw|pop|popa|popad|popf|popfd|push|pusha|pushad|pushf|pushfd|rcl|rcr|rdmsr|rdpmc|rdtsc|rep|repe|repne|repnz|repz|ret|retf|rsm|sahf|sal|sar|sbb|scasb|scasd|scasw|seta|setae|setb|setbe|setc|sete|setg|setge|setl|setle|setna|setnae|setnb|setnbe|setnc|setne|setng|setnge|setnl|setnle|setno|setnp|setns|setnz|seto|setp|setpe|setpo|sets|setz|sgdt|shl|shld|shr|shrd|sidt|sldt|smsw|stc|std|sti|stosb|stosd|stosw|str|sub|test|ud2|verr|verw|wait|wbinvd|wrmsr|xadd|xbts|xchg|xlat|xor|invlpga|swapgs|rdtscp|lfence|mfence|sfence|clflush|movnti|pause|cmovo|cmovno|cmovb|cmovae|cmovz|cmovnz|cmovbe|cmova|cmovs|cmovns|cmovp|cmovnp|cmovl|cmovge|cmovle|cmovg|fcmovb|fcmove|fcmovbe|fcmovu|fcmovnb|fcmovne|fcmovnbe|fcmovnu|jecxz|loopnz|loopz|jrcxz|cmovc|cmovnc|cmovpe|cmovpo)$/i;

    var registers = /^(eax|ebx|ecx|edx|esi|edi|esp|ebp|ax|bx|cx|dx|si|di|sp|bp|ah|bh|ch|dh|al|bl|cl|dl|cs|ds|es|fs|gs|ss)$/i;

    var directives = /^(section|global|extern|align|bits|byte|word|dword|qword|resb|resw|resd|resq|db|dw|dd|dq)$/i;

    var numbers = /^(0x[0-9a-f]+|[0-9]+[duh]?)$/i;

    function tokenBase(stream, state) {
      var ch = stream.next();

      if (ch == ";") {
        stream.skipToEnd();
        return "comment";
      }

      if (ch == '"') {
        state.tokenize = tokenString;
        return state.tokenize(stream, state);
      }

      if (ch == "'") {
        state.tokenize = tokenChar;
        return state.tokenize(stream, state);
      }

      if (/[\[\]]/.test(ch)) {
        return "bracket";
      }

      if (/\d/.test(ch)) {
        stream.eatWhile(/[\da-fx]/i);
        return "number";
      }

      if (/[a-zA-Z_.\$\@][\w\.\$\@]*/.test(ch)) {
        stream.eatWhile(/[\w\.\$\@]/);
        var word = stream.current().toLowerCase();

        if (instructions.test(word)) return "keyword";
        if (registers.test(word)) return "variable-3";
        if (directives.test(word)) return "keyword";
        if (numbers.test(word)) return "number";

        if (stream.match(/:/)) {
          return "label";
        }

        return "variable";
      }

      if (/[+\-*/|&<>%=!]/.test(ch)) {
        return "operator";
      }

      return null;
    }

    function tokenString(stream, state) {
      var escaped = false, next;
      while ((next = stream.next()) != null) {
        if (next == '"' && !escaped) break;
        escaped = !escaped && next == "\\";
      }
      if (!escaped) state.tokenize = tokenBase;
      return "string";
    }

    function tokenChar(stream, state) {
      var next = stream.next();
      if (next == "\\") stream.next(); // Escape sequence
      if (stream.next() == "'") state.tokenize = tokenBase;
      return "string-2";
    }

    return {
      startState: function() {
        return {
          tokenize: tokenBase
        };
      },
      token: function(stream, state) {
        if (stream.eatSpace()) return null;
        return state.tokenize(stream, state);
      },
      lineComment: ";",
    };
  });

  CodeMirror.defineMIME("text/x-intel-asm", "intel-asm");
});
