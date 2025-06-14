<script lang="ts">
  export let value: number;
  export let large: boolean = false;
  export let step: number = 10;

    // List of ASCII costumes (playful poses)
    const costumes = [
    "/     つ✪", 
    "  ( v  v)ﾉ", 
    "乀/ つ💶 m  ", 
    "  ( u  u)ﾉ", 
    " 乀/ っ💰 )  ", 
    " 乀( J  し)  ", 
    "/     づ♡", 
    "ദ്ദി(   m )~~", 
    "ฅ(   ฅ )ﾉ",
    "  (m  m )ﾉ",
    "   じしˍ,)ノ "
  ];

  // Function to get a random costume
    function getRandomCostume() {
    const randomIndex = Math.floor(Math.random() * costumes.length);
    return costumes[randomIndex];
  }

  // Function to get a cat based on value ranges
  function getCat() {
    const maxValue = step * 100;
    const costume = getRandomCostume();
    const ranges = [
      { threshold: maxValue, cat: ` /\\_/\\\n( ^ω^ )\n${costume}` },
      { threshold: maxValue * 0.9, cat: ` /\\_/\\\n( ^ω^ )\n${costume}` },
      { threshold: maxValue * 0.8, cat: ` /\\_/\\\n( ^∀^ )\n${costume}` },
      { threshold: maxValue * 0.7, cat: ` /\\_/\\\n( ^∇^ )\n${costume}` },
      { threshold: maxValue * 0.6, cat: ` /\\_/\\\n( ^◡^ )\n${costume}` },
      { threshold: maxValue * 0.5, cat: ` /\\_/\\\n( ^.^ )\n${costume}` },
      { threshold: maxValue * 0.4, cat: ` /\\_/\\\n( ^-^ )\n${costume}` },
      { threshold: maxValue * 0.3, cat: ` /\\_/\\\n( o.o )\n${costume}` },
      { threshold: maxValue * 0.2, cat: ` /\\_/\\\n( ⊙.⊙ )\n${costume}` },
      { threshold: maxValue * 0.1, cat: ` /\\_/\\\n( °.° )\n${costume}` },
      { threshold: 0, cat: ` /\\_/\\\n( -.- )\n${costume}` },
      { threshold: -maxValue * 0.1, cat: ` /\\_/\\\n( -.- )\n${costume}` },
      { threshold: -maxValue * 0.2, cat: ` /\\_/\\\n( >﹏< )\n${costume}` },
      { threshold: -maxValue * 0.3, cat: ` /\\_/\\\n( >︿< )\n${costume}` },
      { threshold: -maxValue * 0.4, cat: ` /\\_/\\\n( >︵< )\n${costume}` },
      { threshold: -maxValue * 0.5, cat: ` /\\_/\\\n( >︶< )\n${costume}` },
      { threshold: -maxValue * 0.6, cat: ` /\\_/\\\n( >︹< )\n${costume}` },
      { threshold: -maxValue * 0.7, cat: ` /\\_/\\\n( >︺< )\n${costume}` },
      { threshold: -maxValue * 0.8, cat: ` /\\_/\\\n( >︻< )\n${costume}` },
      { threshold: -maxValue * 0.9, cat: ` /\\_/\\\n( >︼< )\n${costume}` },
      { threshold: -maxValue, cat: ` /\\_/\\\n( >︽< )\n${costume}` }
    ];

    for (const range of ranges) {
      if (value > range.threshold) {
        return range.cat;
      }
    }
    return ranges[ranges.length - 1].cat;
  }
</script>

<div class="ascii-cat {large ? 'large' : ''}">
  <pre>{getCat()}</pre>
</div>

<style>
  .ascii-cat {
    font-family: 'JetBrains Mono', 'Fira Mono', 'Menlo', 'Monaco', 'Consolas', monospace;
    white-space: pre;
    text-align: center;
    line-height: 1.2;
    font-size: 3.5rem;
    font-weight: bold;
    color: var(--habit-color);
    opacity: 0.7;
    height: 100%;
    display: flex;
    align-items: center;
    background: none;
    box-shadow: none;
  }
  .ascii-cat.large {
    font-size: 12rem;
    opacity: 1;
    background: none;
    box-shadow: none;
    margin: 0;
    padding: 0;
    width: 100%;
    max-width: none;
  }
  @media (max-width: 600px) {
    .ascii-cat.large {
      font-size: 6rem;
    }
  }
  pre {
    margin: 0;
    padding: 0;
    background: none;
    box-shadow: none;
  }
</style> 