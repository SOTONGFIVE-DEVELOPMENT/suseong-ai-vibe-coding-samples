if (Number(process.versions.node.split('.')[0]) !== 22) {
  console.error('이 실습은 Node.js 22.x를 사용합니다. node --version을 확인하세요.');
  process.exit(1);
}
